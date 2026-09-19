<?php

namespace App\DAO;

use App\Core\Database;
use App\Models\Task;
use PDO;
use RuntimeException;

class TaskDao
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getByProjectId(int $projectId): array
    {
        $sql = "
            SELECT 
                t.*,
                u.name as assignee_name,
                u.role as assignee_role,
                GROUP_CONCAT(td.depends_on_task_id) as dep_ids
            FROM tasks t
            LEFT JOIN users u ON t.assignee_id = u.id
            LEFT JOIN task_dependencies td ON t.id = td.task_id
            WHERE t.project_id = :project_id
            GROUP BY t.id
            ORDER BY t.early_start ASC, t.id ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['project_id' => $projectId]);

        $tasks = [];
        while ($row = $stmt->fetch()) {
            $deps = [];
            if (!empty($row['dep_ids'])) {
                $deps = array_map('intval', explode(',', $row['dep_ids']));
            }
            $row['dependencies'] = $deps;
            $tasks[] = new Task($row);
        }

        return $tasks;
    }

    public function findById(int $id): ?Task
    {
        $sql = "
            SELECT 
                t.*,
                u.name as assignee_name,
                u.role as assignee_role,
                GROUP_CONCAT(td.depends_on_task_id) as dep_ids
            FROM tasks t
            LEFT JOIN users u ON t.assignee_id = u.id
            LEFT JOIN task_dependencies td ON t.id = td.task_id
            WHERE t.id = :id
            GROUP BY t.id
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $deps = [];
        if (!empty($row['dep_ids'])) {
            $deps = array_map('intval', explode(',', $row['dep_ids']));
        }
        $row['dependencies'] = $deps;

        return new Task($row);
    }

    public function create(Task $task): int
    {
        $sql = "
            INSERT INTO tasks (
                project_id, assignee_id, name, duration_hours,
                start_date, end_date, early_start, early_finish,
                late_start, late_finish, slack, is_critical,
                status, version
            ) VALUES (
                :project_id, :assignee_id, :name, :duration_hours,
                :start_date, :end_date, :early_start, :early_finish,
                :late_start, :late_finish, :slack, :is_critical,
                :status, :version
            )
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'project_id' => $task->project_id,
            'assignee_id' => $task->assignee_id,
            'name' => $task->name,
            'duration_hours' => $task->duration_hours,
            'start_date' => $task->start_date,
            'end_date' => $task->end_date,
            'early_start' => $task->early_start,
            'early_finish' => $task->early_finish,
            'late_start' => $task->late_start,
            'late_finish' => $task->late_finish,
            'slack' => $task->slack,
            'is_critical' => $task->is_critical ? 1 : 0,
            'status' => $task->status,
            'version' => $task->version,
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function update(Task $task): bool
    {
        $sql = "
            UPDATE tasks
            SET 
                name = :name,
                duration_hours = :duration_hours,
                assignee_id = :assignee_id,
                status = :status
            WHERE id = :id
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $task->id,
            'name' => $task->name,
            'duration_hours' => $task->duration_hours,
            'assignee_id' => $task->assignee_id,
            'status' => $task->status,
        ]);
    }

    public function updateCalculatedSchedule(int $taskId, array $data): bool
    {
        $sql = "
            UPDATE tasks
            SET 
                start_date = :start_date,
                end_date = :end_date,
                early_start = :early_start,
                early_finish = :early_finish,
                late_start = :late_start,
                late_finish = :late_finish,
                slack = :slack,
                is_critical = :is_critical
            WHERE id = :id
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $taskId,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'early_start' => $data['early_start'],
            'early_finish' => $data['early_finish'],
            'late_start' => $data['late_start'],
            'late_finish' => $data['late_finish'],
            'slack' => $data['slack'],
            'is_critical' => $data['is_critical'] ? 1 : 0,
        ]);
    }

    /**
     * Executes the Stored Procedure `sp_update_task_status`
     * Which incorporates Pessimistic Row Locking (`FOR UPDATE`) and Version Check
     */
    public function updateStatusWithLock(int $taskId, string $newStatus, int $expectedVersion): array
    {
        // Call stored procedure
        $sql = "CALL sp_update_task_status(:task_id, :new_status, :expected_version, @out_success, @out_new_version, @out_message)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'task_id' => $taskId,
            'new_status' => $newStatus,
            'expected_version' => $expectedVersion,
        ]);
        $stmt->closeCursor();

        // Fetch OUT variables
        $outStmt = $this->db->query("SELECT @out_success AS success, @out_new_version AS new_version, @out_message AS message");
        $result = $outStmt->fetch();

        return [
            'success' => (bool)$result['success'],
            'new_version' => (int)$result['new_version'],
            'message' => $result['message'],
        ];
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM tasks WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    public function deleteByProjectId(int $projectId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM tasks WHERE project_id = :project_id");
        return $stmt->execute(['project_id' => $projectId]);
    }
}
