<?php

namespace App\PowerSync;

use App\Models\Program;
use App\Models\Address;

final class AddressPowerSyncUploadApplier
{
    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(array $entry, int $userId): void
    {
        $programId = $entry['id'];
        $op = $entry['op'];
        /** @var array<string, mixed> $data */
        $data = $entry['data'] ?? [];

        $program = Program::query()
            ->whereKey($programId)
            ->where('user_id', $userId)
            ->first();

        if ($program === null) {
            return;
        }

        if ($op === 'DELETE') {
            Address::query()->whereKey($programId)->delete();

            return;
        }

        if ($op === 'PUT') {
            $row = $this->normalizeAddressRow($data);

            if (! $this->rowHasAny($row)) {
                Address::query()->whereKey($programId)->delete();

                return;
            }

            Address::query()->updateOrCreate(
                ['program_id' => $programId],
                $row,
            );

            return;
        }

        if ($op === 'PATCH') {
            $address = Address::query()->whereKey($programId)->first();

            if ($address === null) {
                $row = $this->normalizeAddressRow($data);
                if ($this->rowHasAny($row)) {
                    Address::query()->create(array_merge($row, ['program_id' => $programId]));
                }

                return;
            }

            foreach (['line_1', 'line_2', 'city', 'postal_code', 'country'] as $field) {
                if (array_key_exists($field, $data)) {
                    $value = $data[$field];
                    $address->{$field} = is_string($value) ? $this->normalizeNullableString($value) : null;
                }
            }

            if (! $this->modelHasAny($address)) {
                $address->delete();

                return;
            }

            $address->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for addresses: '.$op);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{line_1: ?string, line_2: ?string, city: ?string, postal_code: ?string, country: ?string}
     */
    private function normalizeAddressRow(array $data): array
    {
        return [
            'line_1' => $this->readOptionalString($data, 'line_1'),
            'line_2' => $this->readOptionalString($data, 'line_2'),
            'city' => $this->readOptionalString($data, 'city'),
            'postal_code' => $this->readOptionalString($data, 'postal_code'),
            'country' => $this->readOptionalString($data, 'country'),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function readOptionalString(array $data, string $key): ?string
    {
        if (! array_key_exists($key, $data)) {
            return null;
        }

        $value = $data[$key];

        if (! is_string($value)) {
            return null;
        }

        return $this->normalizeNullableString($value);
    }

    private function normalizeNullableString(string $value): ?string
    {
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @param  array{line_1: ?string, line_2: ?string, city: ?string, postal_code: ?string, country: ?string}  $row
     */
    private function rowHasAny(array $row): bool
    {
        foreach ($row as $value) {
            if (is_string($value) && $value !== '') {
                return true;
            }
        }

        return false;
    }

    private function modelHasAny(Address $address): bool
    {
        foreach (['line_1', 'line_2', 'city', 'postal_code', 'country'] as $field) {
            $value = $address->{$field};
            if (is_string($value) && trim($value) !== '') {
                return true;
            }
        }

        return false;
    }
}
