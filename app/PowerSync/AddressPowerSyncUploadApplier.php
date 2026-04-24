<?php

namespace App\PowerSync;

use App\Models\Address;
use App\Models\Program;

/**
 * Address row mutations from PowerSync uploads.
 * Rows are not per-user; authorization is not via a user_id column. Any authenticated
 * uploader may apply op entries; the HTTP layer already enforces a logged-in user.
 * Clearing a row (empty PUT/PATCH or DELETE) removes the address and nulls programs.address_id.
 */
final class AddressPowerSyncUploadApplier
{
    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(array $entry, int $userId): void
    {
        $addressId = $entry['id'];
        $op = $entry['op'];
        /** @var array<string, mixed> $data */
        $data = $entry['data'] ?? [];

        if ($op === 'DELETE') {
            $this->nullProgramsReferencingForUser($addressId, $userId);
            $this->deleteAddressIfOrphaned($addressId);

            return;
        }

        if ($op === 'PUT') {
            $row = $this->normalizeAddressRow($data);

            if (! $this->rowHasAny($row)) {
                $this->nullProgramsReferencingForUser($addressId, $userId);
                $this->deleteAddressIfOrphaned($addressId);

                return;
            }

            Address::query()->updateOrCreate(
                ['id' => $addressId],
                $row,
            );

            return;
        }

        if ($op === 'PATCH') {
            $address = Address::query()->whereKey($addressId)->first();

            if ($address === null) {
                $row = $this->normalizeAddressRow($data);
                if (! $this->rowHasAny($row)) {
                    return;
                }

                Address::query()->create(array_merge(
                    $row,
                    ['id' => $addressId],
                ));

                return;
            }

            foreach (['line_1', 'line_2', 'city', 'postal_code', 'country'] as $field) {
                if (array_key_exists($field, $data)) {
                    $value = $data[$field];
                    $address->{$field} = is_string($value) ? $this->normalizeNullableString($value) : null;
                }
            }

            if (! $this->modelHasAny($address)) {
                $this->nullProgramsReferencingForUser($addressId, $userId);
                if (Program::query()->where('address_id', $addressId)->exists()) {
                    $address->save();
                } else {
                    Address::query()->whereKey($addressId)->delete();
                }

                return;
            }

            $address->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for addresses: '.$op);
    }

    private function nullProgramsReferencingForUser(string $addressId, int $userId): void
    {
        Program::query()->where('address_id', $addressId)->where('user_id', $userId)->update(['address_id' => null]);
    }

    private function deleteAddressIfOrphaned(string $addressId): void
    {
        if (Program::query()->where('address_id', $addressId)->exists()) {
            return;
        }

        Address::query()->whereKey($addressId)->delete();
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
