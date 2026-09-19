<?php

namespace App\Services;

use DateTime;
use DateTimeInterface;
use RuntimeException;

class PertCpmService
{
    /**
     * Calculates PERT / CPM schedule for a collection of tasks.
     *
     * @param array $tasks Array of task arrays/objects with keys:
     *                     'id', 'duration_hours', 'dependencies' (array of predecessor task IDs)
     * @param DateTimeInterface $projectStartDate
     * @return array Contains:
     *               'tasks' => mapped tasks with ES, EF, LS, LF, slack, is_critical, start_date, end_date
     *               'total_duration' => total working hours on critical path
     *               'project_end_date' => projected project completion date
     *               'critical_task_ids' => list of IDs on the critical path
     */
    public function calculate(array $tasks, DateTimeInterface $projectStartDate): array
    {
        if (empty($tasks)) {
            return [
                'tasks' => [],
                'total_duration' => 0,
                'project_end_date' => $projectStartDate->format('Y-m-d H:i:s'),
                'critical_task_ids' => []
            ];
        }

        // Standardize indexing by id
        $taskMap = [];
        $adjList = [];     // u -> list of successors v
        $predList = [];    // v -> list of predecessors u
        $inDegree = [];

        foreach ($tasks as $t) {
            $tArr = is_array($t) ? $t : (array)$t;
            $id = $tArr['id'];
            $taskMap[$id] = [
                'id' => $id,
                'name' => $tArr['name'] ?? "Task #$id",
                'duration_hours' => max(0, (int)($tArr['duration_hours'] ?? 0)),
                'dependencies' => $tArr['dependencies'] ?? [],
                'raw' => $tArr
            ];
            $adjList[$id] = [];
            $predList[$id] = [];
            $inDegree[$id] = 0;
        }

        // Build edges
        foreach ($taskMap as $id => $node) {
            foreach ($node['dependencies'] as $depId) {
                // If dependency exists in the task set
                if (isset($taskMap[$depId])) {
                    $adjList[$depId][] = $id;    // depId must complete before id
                    $predList[$id][] = $depId;
                    $inDegree[$id]++;
                }
            }
        }

        // 1. Topological Sort via Kahn's Algorithm
        $queue = [];
        foreach ($inDegree as $id => $deg) {
            if ($deg === 0) {
                $queue[] = $id;
            }
        }

        $topoOrder = [];
        while (!empty($queue)) {
            $u = array_shift($queue);
            $topoOrder[] = $u;

            foreach ($adjList[$u] as $v) {
                $inDegree[$v]--;
                if ($inDegree[$v] === 0) {
                    $queue[] = $v;
                }
            }
        }

        if (count($topoOrder) < count($taskMap)) {
            $unresolved = array_diff(array_keys($taskMap), $topoOrder);
            throw new RuntimeException(
                "Cyclic dependency detected! The following tasks are in a circular loop: " . implode(', ', $unresolved)
            );
        }

        // 2. Forward Pass: Early Start (ES) and Early Finish (EF)
        $es = [];
        $ef = [];

        foreach ($topoOrder as $id) {
            $maxPredEf = 0;
            foreach ($predList[$id] as $predId) {
                if ($ef[$predId] > $maxPredEf) {
                    $maxPredEf = $ef[$predId];
                }
            }
            $es[$id] = $maxPredEf;
            $ef[$id] = $es[$id] + $taskMap[$id]['duration_hours'];
        }

        $projectDuration = empty($ef) ? 0 : max($ef);

        // 3. Backward Pass: Late Start (LS) and Late Finish (LF)
        $ls = [];
        $lf = [];

        $revTopoOrder = array_reverse($topoOrder);
        foreach ($revTopoOrder as $id) {
            if (empty($adjList[$id])) {
                // Sinks finish at project end
                $lf[$id] = $projectDuration;
            } else {
                $minSuccLs = PHP_INT_MAX;
                foreach ($adjList[$id] as $succId) {
                    if ($ls[$succId] < $minSuccLs) {
                        $minSuccLs = $ls[$succId];
                    }
                }
                $lf[$id] = $minSuccLs;
            }
            $ls[$id] = $lf[$id] - $taskMap[$id]['duration_hours'];
        }

        // 4. Slack and Critical Path Identification
        $criticalTaskIds = [];
        $resultTasks = [];

        foreach ($taskMap as $id => $node) {
            $slack = $ls[$id] - $es[$id];
            // Due to integer math, slack == 0 means critical
            $isCritical = ($slack <= 0);
            if ($isCritical) {
                $criticalTaskIds[] = $id;
            }

            // Convert working hour offsets to real datetime using WorkingCalendarHelper
            $taskStartDate = WorkingCalendarHelper::addWorkingHours($projectStartDate, $es[$id]);
            $taskEndDate = WorkingCalendarHelper::addWorkingHours($taskStartDate, $node['duration_hours']);

            $resultTasks[$id] = array_merge($node['raw'], [
                'id' => $id,
                'duration_hours' => $node['duration_hours'],
                'early_start' => $es[$id],
                'early_finish' => $ef[$id],
                'late_start' => $ls[$id],
                'late_finish' => $lf[$id],
                'slack' => $slack,
                'is_critical' => $isCritical,
                'start_date' => $taskStartDate->format('Y-m-d H:i:s'),
                'end_date' => $taskEndDate->format('Y-m-d H:i:s'),
            ]);
        }

        $projectEndDate = WorkingCalendarHelper::addWorkingHours($projectStartDate, $projectDuration);

        return [
            'tasks' => array_values($resultTasks),
            'total_duration' => $projectDuration,
            'project_end_date' => $projectEndDate->format('Y-m-d H:i:s'),
            'critical_task_ids' => $criticalTaskIds,
        ];
    }
}
