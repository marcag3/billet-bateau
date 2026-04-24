<?php

namespace App\PowerSync;

use App\Models\Todo;

final class TodoPowerSyncUploadApplier
{
    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(array $entry, int $userId): void
    {
        $id = $entry['id'];
        $op = $entry['op'];
        /** @var array<string, mixed> $data */
        $data = $entry['data'] ?? [];

        if ($op === 'DELETE') {
            Todo::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->delete();

            return;
        }

        if ($op === 'PUT') {
            $title = isset($data['title']) && is_string($data['title']) ? $data['title'] : '';
            $completed = $this->normalizeCompleted($data['completed'] ?? false);

            Todo::query()->updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => $userId,
                    'title' => $title,
                    'completed' => $completed,
                ],
            );

            return;
        }

        if ($op === 'PATCH') {
            $todo = Todo::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            if ($todo === null) {
                return;
            }

            if (array_key_exists('title', $data) && is_string($data['title'])) {
                $todo->title = $data['title'];
            }

            if (array_key_exists('completed', $data)) {
                $todo->completed = $this->normalizeCompleted($data['completed']);
            }

            $todo->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for todos: '.$op);
    }

    private function normalizeCompleted(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return $value !== 0;
        }

        if (is_string($value)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        return false;
    }
}
