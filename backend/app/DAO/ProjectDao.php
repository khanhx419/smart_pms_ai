<?php

namespace App\DAO;

use App\Core\Database;
use App\Models\Project;
use PDO;

class ProjectDao
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query("
            SELECT p.*, COUNT(t.id) as task_count
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            GROUP BY p.id
            ORDER BY p.id DESC
        ");
        $results = [];
        while ($row = $stmt->fetch()) {
            $project = new Project($row);
            $arr = $project->toArray();
            $arr['task_count'] = (int)$row['task_count'];
            $results[] = $arr;
        }
        return $results;
    }

    public function findById(int $id): ?Project
    {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? new Project($row) : null;
    }

    public function create(Project $project): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO projects (name, description, start_date, status)
            VALUES (:name, :description, :start_date, :status)
        ");
        $stmt->execute([
            'name' => $project->name,
            'description' => $project->description,
            'start_date' => $project->start_date,
            'status' => $project->status,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(Project $project): bool
    {
        $stmt = $this->db->prepare("
            UPDATE projects
            SET name = :name, description = :description, start_date = :start_date, status = :status
            WHERE id = :id
        ");
        return $stmt->execute([
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'start_date' => $project->start_date,
            'status' => $project->status,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
