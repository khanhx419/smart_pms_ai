<?php

namespace App\DAO;

use App\Core\Database;
use App\Models\TaskDependency;
use PDO;

class TaskDependencyDao
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getByProjectId(int $projectId): array
    {
        $stmt = $this->db->prepare("
            SELECT td.* 
            FROM task_dependencies td
            JOIN tasks t ON td.task_id = t.id
            WHERE t.project_id = :project_id
        ");
        $stmt->execute(['project_id' => $projectId]);
        $results = [];
        while ($row = $stmt->fetch()) {
            $results[] = new TaskDependency($row);
        }
        return $results;
    }

    public function getDependenciesForTask(int $taskId): array
    {
        $stmt = $this->db->prepare("
            SELECT depends_on_task_id 
            FROM task_dependencies 
            WHERE task_id = :task_id
        ");
        $stmt->execute(['task_id' => $taskId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function create(int $taskId, int $dependsOnTaskId): int
    {
        $stmt = $this->db->prepare("
            INSERT IGNORE INTO task_dependencies (task_id, depends_on_task_id)
            VALUES (:task_id, :depends_on_task_id)
        ");
        $stmt->execute([
            'task_id' => $taskId,
            'depends_on_task_id' => $dependsOnTaskId,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function deleteByTaskId(int $taskId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM task_dependencies WHERE task_id = :task_id OR depends_on_task_id = :task_id");
        return $stmt->execute(['task_id' => $taskId]);
    }

    public function deleteByProjectId(int $projectId): bool
    {
        $stmt = $this->db->prepare("
            DELETE td FROM task_dependencies td
            JOIN tasks t ON td.task_id = t.id
            WHERE t.project_id = :project_id
        ");
        return $stmt->execute(['project_id' => $projectId]);
    }
}
