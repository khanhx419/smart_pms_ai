<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\DAO\ProjectDao;
use App\DAO\TaskDao;
use App\DAO\TaskDependencyDao;
use App\DAO\UserDao;
use App\Models\Task;
use App\Services\GeminiAiService;
use App\Services\PertCpmService;
use DateTime;
use Throwable;

class AiRequirementController
{
    private ProjectDao $projectDao;
    private TaskDao $taskDao;
    private TaskDependencyDao $depDao;
    private UserDao $userDao;
    private GeminiAiService $aiService;
    private PertCpmService $pertService;

    public function __construct()
    {
        $this->projectDao = new ProjectDao();
        $this->taskDao = new TaskDao();
        $this->depDao = new TaskDependencyDao();
        $this->userDao = new UserDao();
        $this->aiService = new GeminiAiService();
        $this->pertService = new PertCpmService();
    }

    /**
     * Accepts a Use Case document, decomposes it via AI,
     * performs Two-Phase ID Resolution Mapping, runs PERT/CPM with Working Calendar,
     * and persists the resulting WBS within a single DB Transaction.
     */
    public function decomposeAndImport(string|int $projectId): void
    {
        $project = $this->projectDao->findById((int)$projectId);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $useCaseText = trim($input['use_case_text'] ?? '');

        if (empty($useCaseText)) {
            Response::error('Field "use_case_text" cannot be empty', 422);
            return;
        }

        // Optional update of project start_date
        if (!empty($input['start_date'])) {
            $project->start_date = $input['start_date'];
            $this->projectDao->update($project);
        }

        // Fetch team members to match suggested roles
        $users = $this->userDao->getAll();
        $availableRoleNames = array_unique(array_map(fn($u) => $u->role, $users));

        // 1. Call AI Service to decompose Use Case into WBS DAG with temp IDs
        try {
            $wbsTasks = $this->aiService->decomposeUseCase($useCaseText, $availableRoleNames);
        } catch (Throwable $e) {
            Response::error('AI decomposition failed: ' . $e->getMessage(), 500);
            return;
        }

        if (empty($wbsTasks)) {
            Response::error('AI could not extract tasks from the provided specification', 400);
            return;
        }

        // Prepare role-to-user mapping for Resource Allocation
        $roleToUserMap = [];
        foreach ($users as $u) {
            $roleKey = strtolower(trim($u->role));
            if (!isset($roleToUserMap[$roleKey])) {
                $roleToUserMap[$roleKey] = $u->id;
            }
        }

        // 2. Database Transaction: Two-Phase ID Resolution Mapping
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            // Optional: clear existing tasks for clean project re-import
            $replaceExisting = $input['replace_existing'] ?? true;
            if ($replaceExisting) {
                $this->taskDao->deleteByProjectId((int)$projectId);
            }

            // Phase 1: Insert tasks into MySQL and capture Auto-Increment Real IDs
            $idResolutionMap = []; // [temp_id => real_task_id]
            $taskEntityMap = [];   // [real_task_id => raw_task_data]

            foreach ($wbsTasks as $rawTask) {
                $tempId = $rawTask['temp_id'];
                $suggestedRole = strtolower(trim($rawTask['suggested_role'] ?? ''));

                // Find matching assignee ID by role
                $assigneeId = null;
                foreach ($roleToUserMap as $role => $uid) {
                    if (str_contains($suggestedRole, $role) || str_contains($role, $suggestedRole)) {
                        $assigneeId = $uid;
                        break;
                    }
                }
                // Default to first user if no role matched
                if (!$assigneeId && !empty($users)) {
                    $assigneeId = $users[0]->id;
                }

                $task = new Task([
                    'project_id' => (int)$projectId,
                    'assignee_id' => $assigneeId,
                    'name' => $rawTask['name'],
                    'duration_hours' => max(1, (int)$rawTask['duration_hours']),
                    'status' => 'TODO',
                    'version' => 1,
                ]);

                $realId = $this->taskDao->create($task);
                $idResolutionMap[$tempId] = $realId;
                $taskEntityMap[$realId] = [
                    'id' => $realId,
                    'temp_id' => $tempId,
                    'name' => $rawTask['name'],
                    'duration_hours' => max(1, (int)$rawTask['duration_hours']),
                    'assignee_id' => $assigneeId,
                    'dependencies' => []
                ];
            }

            // Phase 2: Insert Task Dependencies using mapped Real IDs
            foreach ($wbsTasks as $rawTask) {
                $tempId = $rawTask['temp_id'];
                $realTaskId = $idResolutionMap[$tempId] ?? null;

                if (!$realTaskId || empty($rawTask['depends_on'])) {
                    continue;
                }

                foreach ($rawTask['depends_on'] as $tempDepId) {
                    if (isset($idResolutionMap[$tempDepId])) {
                        $realDepId = $idResolutionMap[$tempDepId];
                        // Insert foreign key relation
                        $this->depDao->create($realTaskId, $realDepId);
                        $taskEntityMap[$realTaskId]['dependencies'][] = $realDepId;
                    }
                }
            }

            // 3. Compute CPM/PERT and Calendar Scheduling on Real IDs
            $startDate = new DateTime($project->start_date);
            $schedule = $this->pertService->calculate(array_values($taskEntityMap), $startDate);

            // Persist calculated schedule dates, slack, and critical flag
            foreach ($schedule['tasks'] as $scheduled) {
                $this->taskDao->updateCalculatedSchedule($scheduled['id'], [
                    'start_date' => $scheduled['start_date'],
                    'end_date' => $scheduled['end_date'],
                    'early_start' => $scheduled['early_start'],
                    'early_finish' => $scheduled['early_finish'],
                    'late_start' => $scheduled['late_start'],
                    'late_finish' => $scheduled['late_finish'],
                    'slack' => $scheduled['slack'],
                    'is_critical' => $scheduled['is_critical'],
                ]);
            }

            // Commit transaction
            $pdo->commit();

            // Refresh tasks with full join data (assignee name, dependencies, etc.)
            $finalTasks = $this->taskDao->getByProjectId((int)$projectId);

            Response::success([
                'id_resolution_map' => $idResolutionMap,
                'total_tasks' => count($finalTasks),
                'total_duration' => $schedule['total_duration'],
                'critical_task_ids' => $schedule['critical_task_ids'],
                'project_start_date' => $project->start_date,
                'project_end_date' => $schedule['project_end_date'],
                'tasks' => array_map(fn($t) => $t->toArray(), $finalTasks),
            ], 'WBS decomposed, mapped, and scheduled successfully', 201);

        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Failed to process WBS and dependencies: ' . $e->getMessage(), 500);
        }
    }
}
