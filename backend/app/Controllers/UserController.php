<?php

namespace App\Controllers;

use App\Core\Response;
use App\DAO\UserDao;
use App\Models\User;

class UserController
{
    private UserDao $userDao;

    public function __construct()
    {
        $this->userDao = new UserDao();
    }

    public function index(): void
    {
        $users = $this->userDao->getAll();
        $data = array_map(fn($u) => $u->toArray(), $users);
        Response::success($data, 'Users retrieved successfully');
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($input['name']) || empty($input['email'])) {
            Response::error('Name and email are required', 422);
            return;
        }

        $user = new User([
            'name' => trim($input['name']),
            'email' => trim($input['email']),
            'role' => trim($input['role'] ?? 'Developer'),
        ]);

        try {
            $id = $this->userDao->create($user);
            $created = $this->userDao->findById($id);
            Response::success($created ? $created->toArray() : null, 'User created successfully', 201);
        } catch (\Throwable $e) {
            Response::error('Failed to create user: ' . $e->getMessage(), 500);
        }
    }
}
