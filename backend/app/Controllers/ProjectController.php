<?php

namespace App\Controllers;

use App\Core\Response;
use App\DAO\ProjectDao;
use App\DAO\TaskDao;
use App\Models\Project;

class ProjectController
{
    private ProjectDao $projectDao;
    private TaskDao $taskDao;

    public function __construct()
    {
        $this->projectDao = new ProjectDao();
        $this->taskDao = new TaskDao();
    }

    public function index(): void
    {
        $projects = $this->projectDao->getAll();
        Response::success($projects, 'Projects retrieved successfully');
    }

    public function show(string|int $id): void
    {
        $project = $this->projectDao->findById((int)$id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        $tasks = $this->taskDao->getByProjectId((int)$id);
        $projectData = $project->toArray();
        $projectData['tasks'] = array_map(fn($t) => $t->toArray(), $tasks);

        Response::success($projectData, 'Project details retrieved successfully');
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($input['name'])) {
            Response::error('Project name is required', 422);
            return;
        }

        $project = new Project([
            'name' => trim($input['name']),
            'description' => $input['description'] ?? null,
            'start_date' => !empty($input['start_date']) ? $input['start_date'] : date('Y-m-d 08:00:00'),
            'status' => $input['status'] ?? 'PLANNING',
        ]);

        try {
            $id = $this->projectDao->create($project);
            $created = $this->projectDao->findById($id);
            Response::success($created ? $created->toArray() : null, 'Project created successfully', 201);
        } catch (\Throwable $e) {
            Response::error('Failed to create project: ' . $e->getMessage(), 500);
        }
    }

    public function update(string|int $id): void
    {
        $project = $this->projectDao->findById((int)$id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (isset($input['name'])) {
            $project->name = trim($input['name']);
        }
        if (isset($input['description'])) {
            $project->description = $input['description'];
        }
        if (isset($input['start_date'])) {
            $project->start_date = $input['start_date'];
        }
        if (isset($input['status'])) {
            $project->status = $input['status'];
        }

        try {
            $this->projectDao->update($project);
            $updated = $this->projectDao->findById((int)$id);
            Response::success($updated ? $updated->toArray() : null, 'Project updated successfully');
        } catch (\Throwable $e) {
            Response::error('Failed to update project: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(string|int $id): void
    {
        $project = $this->projectDao->findById((int)$id);
        if (!$project) {
            Response::error('Project not found', 404);
            return;
        }

        try {
            $this->projectDao->delete((int)$id);
            Response::success(null, 'Project deleted successfully');
        } catch (\Throwable $e) {
            Response::error('Failed to delete project: ' . $e->getMessage(), 500);
        }
    }
}
