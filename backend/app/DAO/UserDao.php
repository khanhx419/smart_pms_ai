<?php

namespace App\DAO;

use App\Core\Database;
use App\Models\User;
use PDO;

class UserDao
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM users ORDER BY id ASC");
        $results = [];
        while ($row = $stmt->fetch()) {
            $results[] = new User($row);
        }
        return $results;
    }

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function findByRole(string $role): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE role LIKE :role LIMIT 1");
        $stmt->execute(['role' => "%$role%"]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function create(User $user): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, role)
            VALUES (:name, :email, :role)
        ");
        $stmt->execute([
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
        return (int)$this->db->lastInsertId();
    }
}
