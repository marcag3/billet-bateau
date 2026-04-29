<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Addresses\AddressPatchData;
use App\Data\PowerSync\Addresses\AddressPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Address;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
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
            $this->handleDelete($addressId, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = AddressPutData::validateAndCreate($raw);
            $this->handlePut($addressId, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = AddressPatchData::validateAndCreate($raw);
            $this->handlePatch($addressId, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for addresses: '.$op);
    }

    private function handleDelete(string $addressId, int $userId): void
    {
        $address = Address::query()->whereKey($addressId)->first();

        if ($address === null) {
            return;
        }

        $this->assertUserMayModifyAddressRow($address, $userId);

        $this->unlinkAddressFromAllManagingPrograms($addressId, $userId);

        Address::query()->whereKey($addressId)->delete();
    }

    private function handlePut(string $addressId, AddressPutData $dto, int $userId): void
    {
        $program = Program::query()->whereKey($dto->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        $row = $this->rowFromPutDto($dto);

        if (! $this->rowHasAny($row)) {
            $this->unlinkAddressFromAllManagingPrograms($addressId, $userId);
            $this->deleteAddressRowIfUnreferenced($addressId);

            return;
        }

        Address::query()->updateOrCreate(
            ['id' => $addressId],
            array_merge($row, ['program_id' => $dto->program_id]),
        );
    }

    private function handlePatch(string $addressId, AddressPatchData $dto, int $userId): void
    {
        $address = Address::query()->whereKey($addressId)->first();

        if ($address === null) {
            $resolvedProgramId = $this->resolveProgramIdFromPatch($dto);
            if ($resolvedProgramId === null) {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required when creating an address via PATCH.',
                ]);
            }

            $program = Program::query()->whereKey($resolvedProgramId)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $row = $this->rowFromPatchDto($dto);
            if (! $this->rowHasAny($row)) {
                return;
            }

            Address::query()->create(array_merge(
                $row,
                [
                    'id' => $addressId,
                    'program_id' => $resolvedProgramId,
                ],
            ));

            return;
        }

        $this->assertUserMayModifyAddressRow($address, $userId);

        if (! ($dto->program_id instanceof Optional)) {
            if ($dto->program_id !== null && $dto->program_id !== $address->program_id) {
                $next = Program::query()->whereKey($dto->program_id)->first();

                if ($next === null || ! $next->userCanManage($userId)) {
                    throw new AuthorizationException;
                }

                $address->program_id = $dto->program_id;
            }
        }

        foreach (['line_1', 'line_2', 'city', 'postal_code', 'country'] as $field) {
            $prop = $dto->{$field};
            if ($prop instanceof Optional) {
                continue;
            }

            $address->{$field} = $prop;
        }

        if (! $this->modelHasAny($address)) {
            $this->unlinkAddressFromAllManagingPrograms($addressId, $userId);
            $this->deleteAddressRowIfUnreferenced($addressId);

            return;
        }

        $address->save();
    }

    private function assertUserMayModifyAddressRow(Address $address, int $userId): void
    {
        if ($address->program_id !== null) {
            $program = Program::query()->whereKey($address->program_id)->first();

            if ($program !== null && $program->userCanManage($userId)) {
                return;
            }
        }

        $linked = Program::query()->where('address_id', $address->id)->get();
        foreach ($linked as $program) {
            if ($program->userCanManage($userId)) {
                return;
            }
        }

        throw new AuthorizationException;
    }

    /**
     * Clears {@see Program::$address_id} for every program referencing this address, requiring manage permission per row.
     *
     * @throws AuthorizationException
     */
    private function unlinkAddressFromAllManagingPrograms(string $addressId, int $userId): void
    {
        $programs = Program::query()->where('address_id', $addressId)->get();

        foreach ($programs as $program) {
            if (! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }
        }

        foreach ($programs as $program) {
            $program->update(['address_id' => null]);
        }
    }

    private function deleteAddressRowIfUnreferenced(string $addressId): void
    {
        if (Program::query()->where('address_id', $addressId)->exists()) {
            return;
        }

        Address::query()->whereKey($addressId)->delete();
    }

    private function resolveProgramIdFromPatch(AddressPatchData $dto): ?string
    {
        if ($dto->program_id instanceof Optional) {
            return null;
        }

        return $dto->program_id;
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
