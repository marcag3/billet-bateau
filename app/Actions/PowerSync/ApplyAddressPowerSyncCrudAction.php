<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Addresses\AddressPatchData;
use App\Data\PowerSync\Addresses\AddressPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Address;
use App\Models\Program;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Address} rows (addresses upload type).
 */
final class ApplyAddressPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $addressId = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $this->nullProgramsReferencing($addressId);
            $this->deleteAddressIfOrphaned($addressId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = AddressPutData::validateAndCreate($raw);
            $row = $this->rowFromPutDto($dto);

            if (! $this->rowHasAny($row)) {
                $this->nullProgramsReferencing($addressId);
                $this->deleteAddressIfOrphaned($addressId);

                return;
            }

            Address::query()->updateOrCreate(
                ['id' => $addressId],
                $row,
            );

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = AddressPatchData::validateAndCreate($raw);
            $this->applyPatch($addressId, $dto);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for addresses: '.$op);
    }

    private function applyPatch(string $addressId, AddressPatchData $dto): void
    {
        $address = Address::query()->whereKey($addressId)->first();

        if ($address === null) {
            $row = $this->rowFromPatchDto($dto);
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
            $prop = $dto->{$field};
            if ($prop instanceof Optional) {
                continue;
            }

            $address->{$field} = $prop;
        }

        if (! $this->modelHasAny($address)) {
            $this->nullProgramsReferencing($addressId);
            if (Program::query()->where('address_id', $addressId)->exists()) {
                $address->save();
            } else {
                Address::query()->whereKey($addressId)->delete();
            }

            return;
        }

        $address->save();
    }

    private function nullProgramsReferencing(string $addressId): void
    {
        Program::query()->where('address_id', $addressId)->update(['address_id' => null]);
    }

    private function deleteAddressIfOrphaned(string $addressId): void
    {
        if (Program::query()->where('address_id', $addressId)->exists()) {
            return;
        }

        Address::query()->whereKey($addressId)->delete();
    }

    /**
     * @return array{line_1: ?string, line_2: ?string, city: ?string, postal_code: ?string, country: ?string}
     */
    private function rowFromPutDto(AddressPutData $dto): array
    {
        return [
            'line_1' => $dto->line_1,
            'line_2' => $dto->line_2,
            'city' => $dto->city,
            'postal_code' => $dto->postal_code,
            'country' => $dto->country,
        ];
    }

    /**
     * @return array{line_1: ?string, line_2: ?string, city: ?string, postal_code: ?string, country: ?string}
     */
    private function rowFromPatchDto(AddressPatchData $dto): array
    {
        $row = [
            'line_1' => null,
            'line_2' => null,
            'city' => null,
            'postal_code' => null,
            'country' => null,
        ];

        foreach (array_keys($row) as $field) {
            $prop = $dto->{$field};
            if (! ($prop instanceof Optional)) {
                $row[$field] = $prop;
            }
        }

        return $row;
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
