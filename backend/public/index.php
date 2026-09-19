<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AiRequirementController;
use App\Controllers\ProjectController;
use App\Controllers\ScheduleController;
use App\Controllers\TaskController;
use App\Controllers\UserController;
use App\Core\Env;
use App\Core\Response;
use App\Core\Router;

// Load environment variables
Env::load(__DIR__ . '/../.env');

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', '0');

set_exception_handler(function (Throwable $e) {
    Response::error($e->getMessage(), 500, [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
});

$router = new Router();

// Health check
$router->get('/api/health', function () {
    Response::success([
        'service' => 'Smart PMS API',
        'status' => 'healthy',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0.0'
    ]);
});

// Users (Resource Allocation)
$router->get('/api/users', [UserController::class, 'index']);
$router->post('/api/users', [UserController::class, 'store']);

// Projects
$router->get('/api/projects', [ProjectController::class, 'index']);
$router->post('/api/projects', [ProjectController::class, 'store']);
$router->get('/api/projects/{id}', [ProjectController::class, 'show']);
$router->put('/api/projects/{id}', [ProjectController::class, 'update']);
$router->delete('/api/projects/{id}', [ProjectController::class, 'destroy']);

// Tasks
$router->get('/api/projects/{id}/tasks', [TaskController::class, 'index']);
$router->post('/api/projects/{id}/tasks', [TaskController::class, 'store']);
$router->get('/api/tasks/{id}', [TaskController::class, 'show']);
$router->put('/api/tasks/{id}', [TaskController::class, 'update']);
$router->patch('/api/tasks/{id}/status', [TaskController::class, 'updateStatus']);
$router->delete('/api/tasks/{id}', [TaskController::class, 'destroy']);

// Schedule (PERT / CPM Engine)
$router->post('/api/projects/{id}/schedule/recalculate', [ScheduleController::class, 'recalculate']);

// AI Requirement Decomposition (WBS + ID Resolution + Resource Allocation)
$router->post('/api/projects/{id}/ai/decompose', [AiRequirementController::class, 'decomposeAndImport']);

// Dispatch
$router->dispatch();
