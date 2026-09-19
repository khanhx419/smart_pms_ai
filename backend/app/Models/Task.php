<?php

namespace App\Models;

class Task
{
    public ?int $id = null;
    public int $project_id = 0;
    public ?int $assignee_id = null;
    public string $name = '';
    public int $duration_hours = 0;
    public ?string $start_date = null;
    public ?string $end_date = null;
    public int $early_start = 0;
    public int $early_finish = 0;
    public int $late_start = 0;
    public int $late_finish = 0;
    public int $slack = 0;
    public bool $is_critical = false;
    public string $status = 'TODO';
    public int $version = 1;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    // Additional relation fields
    public ?string $assignee_name = null;
    public ?string $assignee_role = null;
    public array $dependencies = []; // array of task IDs this task depends on

    public function __construct(array $data = [])
    {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->project_id = (int)($data['project_id'] ?? 0);
        $this->assignee_id = isset($data['assignee_id']) && $data['assignee_id'] !== '' ? (int)$data['assignee_id'] : null;
        $this->name = $data['name'] ?? '';
        $this->duration_hours = (int)($data['duration_hours'] ?? 0);
        $this->start_date = $data['start_date'] ?? null;
        $this->end_date = $data['end_date'] ?? null;
        $this->early_start = (int)($data['early_start'] ?? 0);
        $this->early_finish = (int)($data['early_finish'] ?? 0);
        $this->late_start = (int)($data['late_start'] ?? 0);
        $this->late_finish = (int)($data['late_finish'] ?? 0);
        $this->slack = (int)($data['slack'] ?? 0);
        $this->is_critical = (bool)($data['is_critical'] ?? false);
        $this->status = $data['status'] ?? 'TODO';
        $this->version = (int)($data['version'] ?? 1);
        $this->created_at = $data['created_at'] ?? null;
        $this->updated_at = $data['updated_at'] ?? null;

        $this->assignee_name = $data['assignee_name'] ?? null;
        $this->assignee_role = $data['assignee_role'] ?? null;
        $this->dependencies = $data['dependencies'] ?? [];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'assignee_id' => $this->assignee_id,
            'assignee_name' => $this->assignee_name,
            'assignee_role' => $this->assignee_role,
            'name' => $this->name,
            'duration_hours' => $this->duration_hours,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'early_start' => $this->early_start,
            'early_finish' => $this->early_finish,
            'late_start' => $this->late_start,
            'late_finish' => $this->late_finish,
            'slack' => $this->slack,
            'is_critical' => $this->is_critical,
            'status' => $this->status,
            'version' => $this->version,
            'dependencies' => $this->dependencies,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
