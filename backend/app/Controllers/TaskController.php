<?php

namespace App\Controllers;

use App\Core\Response;
use App\DAO\ProjectDao;
use App\DAO\TaskDao;
use App\DAO\TaskDependencyDao;
use App\Models\Task;

class TaskController
{
    private TaskDao $taskDao;
    private TaskDependencyDao $depDao;
    private ProjectDao $projectDao;

    public function __construct()
    {
        $this->taskDao = new TaskDao();
        $this->depDao = new TaskDependencyDao();
        $this->projectDao = new ProjectDao();
    }

    public function index(string|int $projectId): void
    {
        $tasks = $this->taskDao->getByProjectId((int)$projectId);
        $data = array_map(fn($t) => $t->toArray(), $tasks);
        Response::success($data, 'Tasks retrieved successfully');
    }

    public function show(string|int $id): void
    {
        $task = $this->taskDao->findById((int)$id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }

        Response::success($task->toArray(), 'Task details retrieved successfully');
    }

    public function store(string|int $projectId): void
    {
        $project = $this->projectDao->findById((int)$projectId);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($input['name'])) {
            Response::error('Task name is required', 422);
            return;
        }

        $task = new Task([
            'project_id' => (int)$projectId,
            'name' => trim($input['name']),
            'duration_hours' => max(1, (int)($input['duration_hours'] ?? 8)),
            'assignee_id' => !empty($input['assignee_id']) ? (int)$input['assignee_id'] : null,
            'status' => $input['status'] ?? 'TODO',
            'version' => 1,
        ]);

        try {
            $id = $this->taskDao->create($task);

            if (!empty($input['dependencies']) && is_array($input['dependencies'])) {
                foreach ($input['dependencies'] as $depId) {
                    $this->depDao->create($id, (int)$depId);
                }
            }

            $created = $this->taskDao->findById($id);
            Response::success($created ? $created->toArray() : null, 'Task created successfully', 201);
        } catch (\Throwable $e) {
            Response::error('Failed to create task: ' . $e->getMessage(), 500);
        }
    }

    public function update(string|int $id): void
    {
        $task = $this->taskDao->findById((int)$id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (isset($input['name'])) {
            $task->name = trim($input['name']);
        }
        if (isset($input['duration_hours'])) {
            $task->duration_hours = max(1, (int)$input['duration_hours']);
        }
        if (array_key_exists('assignee_id', $input)) {
            $task->assignee_id = !empty($input['assignee_id']) ? (int)$input['assignee_id'] : null;
        }
        if (isset($input['status'])) {
            $task->status = $input['status'];
        }

        try {
            $this->taskDao->update($task);

            if (isset($input['dependencies']) && is_array($input['dependencies'])) {
                $this->depDao->deleteByTaskId((int)$id);
                foreach ($input['dependencies'] as $depId) {
                    $this->depDao->create((int)$id, (int)$depId);
                }
            }

            $updated = $this->taskDao->findById((int)$id);
            Response::success($updated ? $updated->toArray() : null, 'Task updated successfully');
        } catch (\Throwable $e) {
            Response::error('Failed to update task: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Updates status using Stored Procedure with Pessimistic Row Locking and Version Checking.
     * Prevents race conditions during concurrent user updates.
     */
    public function updateStatus(string|int $id): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($input['status'])) {
            Response::error('Field "status" is required', 422);
            return;
        }

        if (!isset($input['version'])) {
            Response::error('Field "version" is required for concurrency control', 422);
            return;
        }

        $taskId = (int)$id;
        $newStatus = trim($input['status']);
        $expectedVersion = (int)$input['version'];

        $result = $this->taskDao->updateStatusWithLock($taskId, $newStatus, $expectedVersion);

        if (!$result['success']) {
            // Version mismatch -> Conflict 409
            if (str_contains($result['message'], 'Race condition') || str_contains($result['message'], 'version')) {
                $currentTask = $this->taskDao->findById($taskId);
                Response::error($result['message'], 409, [
                    'current_version' => $result['new_version'],
                    'current_task' => $currentTask ? $currentTask->toArray() : null
                ]);
                return;
            }

            Response::error($result['message'], 400);
            return;
        }

        $updatedTask = $this->taskDao->findById($taskId);
        Response::success([
            'task' => $updatedTask ? $updatedTask->toArray() : null,
            'message' => $result['message'],
            'new_version' => $result['new_version']
        ], 'Task status updated with lock check');
    }

    public function destroy(string|int $id): void
    {
        $task = $this->taskDao->findById((int)$id);
        if (!$task) {
            Response::error('Task not found', 404);
            return;
        }

        try {
            $this->taskDao->delete((int)$id);
            Response::success(null, 'Task deleted successfully');
        } catch (\Throwable $e) {
            Response::error('Failed to delete task: ' . $e->getMessage(), 500);
        }
    }
}
