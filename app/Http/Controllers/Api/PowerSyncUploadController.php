<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PowerSyncUploadController extends Controller
{
    /**
     * Apply a PowerSync CRUD upload batch from the web client (FIFO, synchronous).
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $validated = $request->validate([
            'crud' => ['required', 'array', 'min:1'],
            'crud.*.op' => ['required', Rule::in(['PUT', 'PATCH', 'DELETE'])],
            'crud.*.type' => ['required', 'string', Rule::in(['todos'])],
            'crud.*.id' => ['required', 'uuid'],
            'crud.*.data' => ['nullable', 'array'],
        ]);

        $userId = (int) $user->getAuthIdentifier();

        DB::transaction(function () use ($validated, $userId): void {
            foreach ($validated['crud'] as $entry) {
                $this->applyEntry($entry, $userId);
            }
        });

        return response()->json(['ok' => true]);
    }

    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    private function applyEntry(array $entry, int $userId): void
    {
        // TODO: improve validation
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

        throw new \RuntimeException('Unsupported PowerSync CRUD op: '.$op);
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
