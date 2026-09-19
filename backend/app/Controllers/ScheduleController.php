<?php

namespace App\Controllers;

use App\Core\Response;
use App\DAO\ProjectDao;
use App\DAO\TaskDao;
use App\Services\PertCpmService;
use DateTime;

class ScheduleController
{
    private ProjectDao $projectDao;
    private TaskDao $taskDao;
    private PertCpmService $pertService;

    public function __construct()
    {
        $this->projectDao = new ProjectDao();
        $this->taskDao = new TaskDao();
        $this->pertService = new PertCpmService();
    }

    public function recalculate(string|int $projectId): void
    {
        $project = $this->projectDao->findById((int)$projectId);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        $tasks = $this->taskDao->getByProjectId((int)$projectId);
        if (empty($tasks)) {
            Response::success([
                'tasks' => [],
                'total_duration' => 0,
                'critical_task_ids' => [],
                'project_end_date' => $project->start_date
            ], 'No tasks to schedule');
            return;
        }

        $taskArrays = array_map(fn($t) => $t->toArray(), $tasks);

        try {
            $startDate = new DateTime($project->start_date);
            $schedule = $this->pertService->calculate($taskArrays, $startDate);

            // Persist calculated values into DB
            foreach ($schedule['tasks'] as $scheduledTask) {
                $this->taskDao->updateCalculatedSchedule($scheduledTask['id'], [
                    'start_date' => $scheduledTask['start_date'],
                    'end_date' => $scheduledTask['end_date'],
                    'early_start' => $scheduledTask['early_start'],
                    'early_finish' => $scheduledTask['early_finish'],
                    'late_start' => $scheduledTask['late_start'],
                    'late_finish' => $scheduledTask['late_finish'],
                    'slack' => $scheduledTask['slack'],
                    'is_critical' => $scheduledTask['is_critical'],
                ]);
            }

            // Refresh tasks with updated relations
            $updatedTasks = $this->taskDao->getByProjectId((int)$projectId);

            Response::success([
                'tasks' => array_map(fn($t) => $t->toArray(), $updatedTasks),
                'total_duration' => $schedule['total_duration'],
                'critical_task_ids' => $schedule['critical_task_ids'],
                'project_start_date' => $project->start_date,
                'project_end_date' => $schedule['project_end_date'],
            ], 'Schedule recalculated successfully');

        } catch (\Throwable $e) {
            Response::error('Scheduling failed: ' . $e->getMessage(), 400);
        }
    }
}
