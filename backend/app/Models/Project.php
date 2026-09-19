<?php

namespace App\Models;

class Project
{
    public ?int $id = null;
    public string $name = '';
    public ?string $description = null;
    public string $start_date = '';
    public string $status = 'PLANNING';
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function __construct(array $data = [])
    {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->name = $data['name'] ?? '';
        $this->description = $data['description'] ?? null;
        $this->start_date = $data['start_date'] ?? date('Y-m-d H:i:s');
        $this->status = $data['status'] ?? 'PLANNING';
        $this->created_at = $data['created_at'] ?? null;
        $this->updated_at = $data['updated_at'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'start_date' => $this->start_date,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
