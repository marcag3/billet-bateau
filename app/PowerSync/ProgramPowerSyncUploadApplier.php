<?php

namespace App\PowerSync;

use App\Models\Program;

final class ProgramPowerSyncUploadApplier
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
            Program::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->delete();

            return;
        }

        if ($op === 'PUT') {
            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
            $description = isset($data['description']) && is_string($data['description']) ? $data['description'] : null;
            $themeColor = isset($data['theme_color']) && is_string($data['theme_color']) ? strtoupper(trim($data['theme_color'])) : '#000000';

            if (! preg_match('/^#[0-9A-F]{6}$/', $themeColor)) {
                $themeColor = '#000000';
            }

            Program::query()->updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => $userId,
                    'name' => $name !== '' ? $name : 'Untitled',
                    'description' => $description,
                    'theme_color' => $themeColor,
                ],
            );

            return;
        }

        if ($op === 'PATCH') {
            $program = Program::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            if ($program === null) {
                return;
            }

            if (array_key_exists('name', $data) && is_string($data['name'])) {
                $trimmed = trim($data['name']);
                if ($trimmed !== '') {
                    $program->name = $trimmed;
                }
            }

            if (array_key_exists('description', $data) && (is_string($data['description']) || $data['description'] === null)) {
                $program->description = $data['description'];
            }

            if (array_key_exists('theme_color', $data) && is_string($data['theme_color'])) {
                $next = strtoupper(trim($data['theme_color']));
                if (preg_match('/^#[0-9A-F]{6}$/', $next) === 1) {
                    $program->theme_color = $next;
                }
            }

            $program->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for programs: '.$op);
    }
}
