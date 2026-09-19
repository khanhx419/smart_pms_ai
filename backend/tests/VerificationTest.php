<?php

namespace Tests;

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;
use App\Core\Env;
use App\DAO\ProjectDao;
use App\DAO\TaskDao;
use App\DAO\TaskDependencyDao;
use App\DAO\UserDao;
use App\Models\Project;
use App\Models\Task;
use App\Services\GeminiAiService;
use App\Services\PertCpmService;
use App\Services\WorkingCalendarHelper;
use DateTime;
use Exception;

Env::load(__DIR__ . '/../.env');

class VerificationTest
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "========================================================\n";
        echo " Smart PMS - Automated Verification Test Suite\n";
        echo "========================================================\n\n";

        $this->testWorkingCalendar();
        $this->testPertCpmAlgorithm();
        $this->testTwoPhaseIdResolutionAndDatabase();
        $this->testStoredProcedureLockingAndRaceCondition();

        echo "\n--------------------------------------------------------\n";
        echo "SUMMARY: Passed: {$this->passed}, Failed: {$this->failed}\n";
        echo "========================================================\n";

        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $testName, string $details = ''): void
    {
        if ($condition) {
            echo " [PASS] {$testName}\n";
            $this->passed++;
        } else {
            echo " [FAIL] {$testName} - {$details}\n";
            $this->failed++;
        }
    }

    /**
     * Test 1: Working Calendar Helper
     */
    private function testWorkingCalendar(): void
    {
        echo "--- Test Group 1: Working Calendar Scheduling ---\n";

        // Friday 15:00 + 8 working hours:
        // 2h Friday (15:00-17:00) + Sat/Sun skipped + Mon (08:00-12:00, 4h) + lunch skipped (12:00-13:00) + Mon (13:00-15:00, 2h)
        // -> Expected: Monday 15:00
        $friday = new DateTime('2026-09-18 15:00:00');
        $result = WorkingCalendarHelper::addWorkingHours($friday, 8);
        $this->assert(
            $result->format('Y-m-d H:i:s') === '2026-09-21 15:00:00',
            "Friday 15:00 + 8h should finish at Monday 15:00 (skipping weekends & lunch)",
            "Got: " . $result->format('Y-m-d H:i:s')
        );

        // Morning start 08:00 + 4 hours -> 12:00
        $monMorning = new DateTime('2026-09-21 08:00:00');
        $res4h = WorkingCalendarHelper::addWorkingHours($monMorning, 4);
        $this->assert(
            $res4h->format('Y-m-d H:i:s') === '2026-09-21 12:00:00',
            "Monday 08:00 + 4h should finish at 12:00",
            "Got: " . $res4h->format('Y-m-d H:i:s')
        );

        // Morning start 08:00 + 5 hours -> 14:00 (due to 12-13 lunch)
        $res5h = WorkingCalendarHelper::addWorkingHours($monMorning, 5);
        $this->assert(
            $res5h->format('Y-m-d H:i:s') === '2026-09-21 14:00:00',
            "Monday 08:00 + 5h should finish at 14:00 (skipping 1h lunch)",
            "Got: " . $res5h->format('Y-m-d H:i:s')
        );
    }

    /**
     * Test 2: PERT/CPM Forward/Backward Pass and Critical Path
     */
    private function testPertCpmAlgorithm(): void
    {
        echo "\n--- Test Group 2: PERT / CPM Algorithm ---\n";

        $pert = new PertCpmService();
        $tasks = [
            ['id' => 10, 'name' => 'Design', 'duration_hours' => 3, 'dependencies' => []],
            ['id' => 20, 'name' => 'BE Base', 'duration_hours' => 4, 'dependencies' => [10]],
            ['id' => 30, 'name' => 'FE Base', 'duration_hours' => 2, 'dependencies' => [10]],
            ['id' => 40, 'name' => 'BE API', 'duration_hours' => 5, 'dependencies' => [20]],
            ['id' => 50, 'name' => 'FE UI', 'duration_hours' => 1, 'dependencies' => [30]],
            ['id' => 60, 'name' => 'Testing', 'duration_hours' => 2, 'dependencies' => [40, 50]],
        ];

        $schedule = $pert->calculate($tasks, new DateTime('2026-09-21 08:00:00'));

        $this->assert($schedule['total_duration'] === 14, "Project critical duration is 14 hours", "Got: " . $schedule['total_duration']);
        $this->assert($schedule['critical_task_ids'] === [10, 20, 40, 60], "Critical path contains tasks 10, 20, 40, 60", "Got: " . json_encode($schedule['critical_task_ids']));

        // Check Slack of non-critical task 30: ES=3, EF=5, LS=9, LF=11, Slack=6
        $task30 = array_values(array_filter($schedule['tasks'], fn($t) => $t['id'] === 30))[0];
        $this->assert($task30['slack'] === 6, "Task 30 has 6 hours slack", "Got: " . $task30['slack']);
        $this->assert($task30['is_critical'] === false, "Task 30 is not critical", "Got: " . ($task30['is_critical'] ? 'true' : 'false'));

        // Check Cycle Detection
        $cyclicTasks = [
            ['id' => 1, 'duration_hours' => 2, 'dependencies' => [2]],
            ['id' => 2, 'duration_hours' => 3, 'dependencies' => [1]],
        ];
        $threwCycle = false;
        try {
            $pert->calculate($cyclicTasks, new DateTime());
        } catch (Exception $e) {
            $threwCycle = str_contains($e->getMessage(), 'Cyclic dependency');
        }
        $this->assert($threwCycle, "Topological sort detects cycle and throws exception");
    }

    /**
     * Test 3: Two-Phase ID Resolution Mapping & DB Integrity
     */
    private function testTwoPhaseIdResolutionAndDatabase(): void
    {
        echo "\n--- Test Group 3: Two-Phase ID Resolution Mapping & DB ---\n";

        $db = Database::getConnection();
        $taskDao = new TaskDao($db);
        $depDao = new TaskDependencyDao($db);

        // Insert test project
        $projDao = new ProjectDao($db);
        $testProjId = $projDao->create(new Project([
            'name' => 'Automated Test Project',
            'description' => 'Test project for ID Resolution',
            'start_date' => '2026-09-21 08:00:00',
            'status' => 'PLANNING'
        ]));

        $mockWbs = [
            ['temp_id' => 'TMP_A', 'name' => 'Architecture', 'duration_hours' => 8, 'depends_on' => []],
            ['temp_id' => 'TMP_B', 'name' => 'Database Schema', 'duration_hours' => 12, 'depends_on' => ['TMP_A']],
            ['temp_id' => 'TMP_C', 'name' => 'Backend Core', 'duration_hours' => 16, 'depends_on' => ['TMP_B']],
        ];

        // Phase 1: Insert tasks and capture real auto-increment IDs
        $idMap = [];
        foreach ($mockWbs as $t) {
            $realId = $taskDao->create(new Task([
                'project_id' => $testProjId,
                'name' => $t['name'],
                'duration_hours' => $t['duration_hours'],
                'status' => 'TODO',
                'version' => 1
            ]));
            $idMap[$t['temp_id']] = $realId;
        }

        // Phase 2: Insert dependencies using mapped real IDs
        foreach ($mockWbs as $t) {
            $realTaskId = $idMap[$t['temp_id']];
            foreach ($t['depends_on'] as $tempDepId) {
                $realDepId = $idMap[$tempDepId];
                $depDao->create($realTaskId, $realDepId);
            }
        }

        // Verify foreign key integrity and dependency query
        $taskCRealId = $idMap['TMP_C'];
        $taskBRealId = $idMap['TMP_B'];
        $depsOfC = $depDao->getDependenciesForTask($taskCRealId);

        $this->assert(in_array($taskBRealId, $depsOfC), "Task C correctly depends on Real ID of Task B in MySQL", "Deps: " . json_encode($depsOfC));

        // Clean up test project
        $projDao->delete($testProjId);
    }

    /**
     * Test 4: Stored Procedure Locking & Race Condition Prevention
     */
    private function testStoredProcedureLockingAndRaceCondition(): void
    {
        echo "\n--- Test Group 4: Stored Procedure Locking & Concurrency ---\n";

        $db = Database::getConnection();
        $taskDao = new TaskDao($db);
        $projDao = new ProjectDao($db);

        $testProjId = $projDao->create(new Project([
            'name' => 'Locking Test Project',
            'start_date' => '2026-09-21 08:00:00',
        ]));

        $taskId = $taskDao->create(new Task([
            'project_id' => $testProjId,
            'name' => 'Concurrent Task',
            'duration_hours' => 8,
            'status' => 'TODO',
            'version' => 1
        ]));

        // 1. Valid update with expected version = 1
        $res1 = $taskDao->updateStatusWithLock($taskId, 'IN_PROGRESS', 1);
        $this->assert($res1['success'] === true, "First update with expected version 1 succeeds");
        $this->assert($res1['new_version'] === 2, "Task version bumped to 2", "Got: " . $res1['new_version']);

        // 2. Conflicting update with stale expected version = 1
        $res2 = $taskDao->updateStatusWithLock($taskId, 'DONE', 1);
        $this->assert($res2['success'] === false, "Second update with stale version 1 is blocked by Stored Procedure");
        $this->assert(str_contains($res2['message'], 'Race condition'), "Conflict message explains version discrepancy", "Got: " . $res2['message']);

        // 3. Clean up
        $projDao->delete($testProjId);
    }
}

$testSuite = new VerificationTest();
$testSuite->run();
