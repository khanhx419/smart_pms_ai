<?php

namespace App\Models;

class TaskDependency
{
    public ?int $id = null;
    public int $task_id = 0;
    public int $depends_on_task_id = 0;
    public ?string $created_at = null;

    public function __construct(array $data = [])
    {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->task_id = (int)($data['task_id'] ?? 0);
        $this->depends_on_task_id = (int)($data['depends_on_task_id'] ?? 0);
        $this->created_at = $data['created_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'depends_on_task_id' => $this->depends_on_task_id,
            'created_at' => $this->created_at,
        ];
    }
}
