<?php

namespace App\PowerSync;

use App\Models\BoatType;

final class BoatTypePowerSyncUploadApplier
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
            $boatType = BoatType::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            $boatType?->delete();

            return;
        }

        if ($op === 'PUT') {
            $existing = BoatType::query()->whereKey($id)->first();
            if ($existing !== null && (int) $existing->user_id !== $userId) {
                return;
            }

            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';

            BoatType::query()->updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => $userId,
                    'name' => $name !== '' ? $name : 'Untitled',
                ],
            );

            return;
        }

        if ($op === 'PATCH') {
            $boatType = BoatType::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            if ($boatType === null) {
                return;
            }

            if (array_key_exists('name', $data) && is_string($data['name'])) {
                $trimmed = trim($data['name']);
                if ($trimmed !== '') {
                    $boatType->name = $trimmed;
                }
            }

            $boatType->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boat_types: '.$op);
    }
}
