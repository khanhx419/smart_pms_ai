<?php

namespace App\Services;

use App\Core\Env;
use RuntimeException;

class GeminiAiService
{
    private ?string $geminiApiKey;
    private ?string $openaiApiKey;

    public function __construct()
    {
        $this->geminiApiKey = Env::get('GEMINI_API_KEY');
        $this->openaiApiKey = Env::get('OPENAI_API_KEY');
    }

    /**
     * Decomposes a Use Case specification into a structured WBS task array.
     *
     * @param string $useCaseText Description of features/requirements
     * @param array $availableRoles List of team roles
     * @return array List of tasks with temp_id, name, duration_hours, suggested_role, depends_on
     */
    public function decomposeUseCase(string $useCaseText, array $availableRoles = []): array
    {
        // 1. Try Gemini if API key is provided
        if (!empty($this->geminiApiKey)) {
            try {
                return $this->callGeminiApi($useCaseText, $availableRoles);
            } catch (\Throwable $e) {
                error_log("Gemini API call failed: " . $e->getMessage() . ". Falling back to smart generator.");
            }
        }

        // 2. Try OpenAI if API key is provided
        if (!empty($this->openaiApiKey)) {
            try {
                return $this->callOpenAiApi($useCaseText, $availableRoles);
            } catch (\Throwable $e) {
                error_log("OpenAI API call failed: " . $e->getMessage() . ". Falling back to smart generator.");
            }
        }

        // 3. Intelligent rule-based domain decomposer fallback
        return $this->generateSmartDecomposition($useCaseText, $availableRoles);
    }

    private function callGeminiApi(string $useCaseText, array $roles): array
    {
        $rolesStr = implode(', ', $roles ?: ['Project Manager', 'Backend Developer', 'Frontend Developer', 'UI/UX Designer', 'QA Engineer']);
        $prompt = <<<PROMPT
You are a senior Software Project Manager and System Architect.
Analyze the following project Use Case specification and break it down into an accurate, complete Work Breakdown Structure (WBS) with logical task dependencies (Directed Acyclic Graph).

Available roles: {$rolesStr}

Use Case Specification:
"""
{$useCaseText}
"""

Return ONLY a valid JSON object with a "tasks" key containing an array of task items. Do not include markdown code block quotes (like ```json).
Each item must contain:
- "temp_id": string (e.g. "T1", "T2", "T3", ...)
- "name": string (descriptive Vietnamese or English task title)
- "duration_hours": integer (estimated working hours, between 4 and 40)
- "suggested_role": string (must match one of the available roles)
- "depends_on": array of strings (list of "temp_id" that must be completed before this task can start, forming a valid DAG with no cycles)
PROMPT;

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $this->geminiApiKey;

        $body = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $prompt]
                    ]
                ]
            ],
            "generationConfig" => [
                "response_mime_type" => "application/json",
                "temperature" => 0.2
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException("CURL error: " . $err);
        }

        if ($httpCode >= 400) {
            throw new RuntimeException("Gemini API returned error {$httpCode}: " . $response);
        }

        $decoded = json_decode($response, true);
        $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $data = json_decode($text, true);

        if (isset($data['tasks']) && is_array($data['tasks'])) {
            return $this->validateAndNormalizeWbs($data['tasks']);
        }

        throw new RuntimeException("Invalid response format from Gemini");
    }

    private function callOpenAiApi(string $useCaseText, array $roles): array
    {
        $rolesStr = implode(', ', $roles ?: ['Project Manager', 'Backend Developer', 'Frontend Developer', 'UI/UX Designer', 'QA Engineer']);
        $prompt = "You are a senior Software Project Manager. Break down this Use Case into a WBS JSON DAG.\nRoles: {$rolesStr}\nSpec:\n{$useCaseText}";

        $url = "https://api.openai.com/v1/chat/completions";
        $body = [
            "model" => "gpt-4o-mini",
            "messages" => [
                [
                    "role" => "system",
                    "content" => "You are an expert project planner. Respond strictly with JSON format: {\"tasks\": [{\"temp_id\": \"T1\", \"name\": \"...\", \"duration_hours\": 16, \"suggested_role\": \"...\", \"depends_on\": []}]}"
                ],
                ["role" => "user", "content" => $prompt]
            ],
            "response_format" => ["type" => "json_object"],
            "temperature" => 0.2
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->openaiApiKey
            ],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err || $httpCode >= 400) {
            throw new RuntimeException("OpenAI API error: " . ($err ?: $response));
        }

        $decoded = json_decode($response, true);
        $text = $decoded['choices'][0]['message']['content'] ?? '';
        $data = json_decode($text, true);

        if (isset($data['tasks']) && is_array($data['tasks'])) {
            return $this->validateAndNormalizeWbs($data['tasks']);
        }

        throw new RuntimeException("Invalid response format from OpenAI");
    }

    /**
     * Smart fallback engine that generates realistic WBS tasks based on keywords in use case.
     */
    private function generateSmartDecomposition(string $useCaseText, array $roles): array
    {
        $hasAuth = preg_match('/đăng nhập|login|auth|xác thực|tài khoản/i', $useCaseText);
        $hasPayment = preg_match('/thanh toán|payment|vnpay|momo|ngân hàng|cart|giỏ hàng/i', $useCaseText);
        $hasReport = preg_match('/báo cáo|thống kê|report|dashboard|analytics/i', $useCaseText);

        $tasks = [
            [
                'temp_id' => 'T1',
                'name' => 'Phân tích tài liệu nghiệp vụ & Thiết kế kiến trúc tổng thể',
                'duration_hours' => 12,
                'suggested_role' => 'Project Manager',
                'depends_on' => []
            ],
            [
                'temp_id' => 'T2',
                'name' => 'Thiết kế cơ sở dữ liệu (Database Schema DDL & Indexes)',
                'duration_hours' => 16,
                'suggested_role' => 'Backend Developer',
                'depends_on' => ['T1']
            ],
            [
                'temp_id' => 'T3',
                'name' => 'Thiết kế Wireframe & UI/UX Prototype (Figma)',
                'duration_hours' => 20,
                'suggested_role' => 'UI/UX Designer',
                'depends_on' => ['T1']
            ],
        ];

        $curId = 4;
        $prevBackend = 'T2';
        $prevFrontend = 'T3';

        if ($hasAuth) {
            $authBe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $authBe,
                'name' => 'Xây dựng API Xác thực & Phân quyền (JWT / Auth)',
                'duration_hours' => 16,
                'suggested_role' => 'Backend Developer',
                'depends_on' => [$prevBackend]
            ];
            $curId++;

            $authFe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $authFe,
                'name' => 'Xây dựng Giao diện Đăng nhập, Đăng ký & Bảo mật phiên',
                'duration_hours' => 12,
                'suggested_role' => 'Frontend Developer',
                'depends_on' => [$prevFrontend, $authBe]
            ];
            $curId++;
            $prevBackend = $authBe;
            $prevFrontend = $authFe;
        }

        $coreBe = "T{$curId}";
        $tasks[] = [
            'temp_id' => $coreBe,
            'name' => 'Phát triển RESTful API nghiệp vụ lõi & Stored Procedures',
            'duration_hours' => 24,
            'suggested_role' => 'Backend Developer',
            'depends_on' => [$prevBackend]
        ];
        $curId++;

        $coreFe = "T{$curId}";
        $tasks[] = [
            'temp_id' => $coreFe,
            'name' => 'Phát triển Giao diện Client tương tác nghiệp vụ & Quản lý State',
            'duration_hours' => 24,
            'suggested_role' => 'Frontend Developer',
            'depends_on' => [$prevFrontend, $coreBe]
        ];
        $curId++;

        if ($hasPayment) {
            $payBe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $payBe,
                'name' => 'Tích hợp Cổng thanh toán & Xử lý Webhook giao dịch',
                'duration_hours' => 20,
                'suggested_role' => 'Backend Developer',
                'depends_on' => [$coreBe]
            ];
            $curId++;

            $payFe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $payFe,
                'name' => 'Tích hợp luồng thanh toán và màn hình hóa đơn phía người dùng',
                'duration_hours' => 16,
                'suggested_role' => 'Frontend Developer',
                'depends_on' => [$coreFe, $payBe]
            ];
            $curId++;
            $coreBe = $payBe;
            $coreFe = $payFe;
        }

        if ($hasReport) {
            $repBe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $repBe,
                'name' => 'Xây dựng API Báo cáo tổng hợp & Truy vấn dữ liệu thống kê',
                'duration_hours' => 16,
                'suggested_role' => 'Backend Developer',
                'depends_on' => [$coreBe]
            ];
            $curId++;

            $repFe = "T{$curId}";
            $tasks[] = [
                'temp_id' => $repFe,
                'name' => 'Phát triển Dashboard biểu đồ tương tác số liệu trực quan',
                'duration_hours' => 16,
                'suggested_role' => 'Frontend Developer',
                'depends_on' => [$coreFe, $repBe]
            ];
            $curId++;
            $coreBe = $repBe;
            $coreFe = $repFe;
        }

        // QA & Integration
        $qaTask = "T{$curId}";
        $tasks[] = [
            'temp_id' => $qaTask,
            'name' => 'Kiểm thử hộp đen (Black-box), Integration Testing & Tối ưu hiệu năng',
            'duration_hours' => 20,
            'suggested_role' => 'QA Engineer',
            'depends_on' => [$coreBe, $coreFe]
        ];
        $curId++;

        // Deployment
        $tasks[] = [
            'temp_id' => "T{$curId}",
            'name' => 'UAT bàn giao người dùng & Thiết lập môi trường Production CI/CD',
            'duration_hours' => 12,
            'suggested_role' => 'Project Manager',
            'depends_on' => [$qaTask]
        ];

        return $tasks;
    }

    private function validateAndNormalizeWbs(array $rawTasks): array
    {
        $clean = [];
        foreach ($rawTasks as $idx => $t) {
            $tempId = !empty($t['temp_id']) ? (string)$t['temp_id'] : 'T' . ($idx + 1);
            $clean[] = [
                'temp_id' => $tempId,
                'name' => trim($t['name'] ?? "Task $tempId"),
                'duration_hours' => max(1, (int)($t['duration_hours'] ?? 8)),
                'suggested_role' => $t['suggested_role'] ?? 'Developer',
                'depends_on' => is_array($t['depends_on'] ?? null) ? array_values(array_unique($t['depends_on'])) : []
            ];
        }
        return $clean;
    }
}
