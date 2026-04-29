<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\TicketTypes\TicketTypePatchData;
use App\Data\PowerSync\TicketTypes\TicketTypePutData;
use App\Models\Program;
use App\Models\TicketType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see TicketType} rows (ticket_types upload type).
 */
final class ApplyTicketTypePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $ticketType = TicketType::query()->whereKey($id)->first();

            if ($ticketType === null) {
                return;
            }

            $this->assertProgramManaged((string) $ticketType->program_id, $userId);
            $ticketType->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = TicketTypePutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = TicketTypePatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for ticket_types: '.$op);
    }

    private function applyPut(string $id, TicketTypePutData $dto, int $userId): void
    {
        $existing = TicketType::query()->whereKey($id)->first();

        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if (! ($dto->program_id instanceof Optional) && $dto->program_id !== null && $dto->program_id !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            $programId = $dto->program_id;
            if ($programId === null || $programId === '') {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }
        }

        $this->assertProgramManaged($programId, $userId);

        $title = $dto->title instanceof Optional ? ($existing?->title ?? null) : $dto->title;
        if ($title === null || $title === '') {
            throw ValidationException::withMessages([
                'data.title' => 'Title is required.',
            ]);
        }

        $priceCents = $dto->price_cents instanceof Optional ? $existing?->price_cents : $dto->price_cents;
        $isPayWhatYouCan = $dto->is_pay_what_you_can instanceof Optional
            ? (bool) ($existing?->is_pay_what_you_can ?? false)
            : (bool) $dto->is_pay_what_you_can;
        $minPerPurchase = $dto->min_per_purchase instanceof Optional ? ($existing?->min_per_purchase ?? 0) : $dto->min_per_purchase;
        $maxPerPurchase = $dto->max_per_purchase instanceof Optional ? $existing?->max_per_purchase : $dto->max_per_purchase;
        $tripInventoryCaps = $dto->trip_inventory_caps instanceof Optional
            ? ($existing?->trip_inventory_caps ?? [])
            : $this->normalizeTripInventoryCaps($dto->trip_inventory_caps);

        if ($minPerPurchase === null) {
            $minPerPurchase = 0;
        }

        if ($maxPerPurchase !== null && $maxPerPurchase < $minPerPurchase) {
            throw ValidationException::withMessages([
                'data.max_per_purchase' => 'Max per purchase must be greater than or equal to min per purchase.',
            ]);
        }

        TicketType::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'title' => $title,
                'price_cents' => $priceCents,
                'is_pay_what_you_can' => $isPayWhatYouCan,
                'min_per_purchase' => $minPerPurchase,
                'max_per_purchase' => $maxPerPurchase,
                'trip_inventory_caps' => $tripInventoryCaps,
            ],
        );
    }

    private function applyPatch(string $id, TicketTypePatchData $dto, int $userId): void
    {
        $ticketType = TicketType::query()->whereKey($id)->first();

        if ($ticketType === null) {
            return;
        }

        $this->assertProgramManaged((string) $ticketType->program_id, $userId);

        if (! ($dto->program_id instanceof Optional)) {
            if ($dto->program_id !== null && $dto->program_id !== (string) $ticketType->program_id) {
                throw new AuthorizationException;
            }
        }

        if (! ($dto->title instanceof Optional)) {
            if ($dto->title === null || $dto->title === '') {
                throw ValidationException::withMessages([
                    'data.title' => 'Title is required.',
                ]);
            }
            $ticketType->title = $dto->title;
        }

        if (! ($dto->price_cents instanceof Optional)) {
            $ticketType->price_cents = $dto->price_cents;
        }

        if (! ($dto->is_pay_what_you_can instanceof Optional)) {
            $ticketType->is_pay_what_you_can = (bool) $dto->is_pay_what_you_can;
        }

        if (! ($dto->min_per_purchase instanceof Optional)) {
            $ticketType->min_per_purchase = $dto->min_per_purchase ?? 0;
        }

        if (! ($dto->max_per_purchase instanceof Optional)) {
            $ticketType->max_per_purchase = $dto->max_per_purchase;
        }

        if ($ticketType->max_per_purchase !== null && $ticketType->max_per_purchase < $ticketType->min_per_purchase) {
            throw ValidationException::withMessages([
                'data.max_per_purchase' => 'Max per purchase must be greater than or equal to min per purchase.',
            ]);
        }

        if (! ($dto->trip_inventory_caps instanceof Optional)) {
            $ticketType->trip_inventory_caps = $this->normalizeTripInventoryCaps($dto->trip_inventory_caps);
        }

        $ticketType->save();
    }

    private function assertProgramManaged(string $programId, int $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    /**
     * @param  array<string, mixed>|string  $rawCaps
     * @return array<string, int|null>
     */
    private function normalizeTripInventoryCaps(array|string $rawCaps): array
    {
        if (is_string($rawCaps)) {
            if ($rawCaps === '') {
                return [];
            }

            $decoded = json_decode($rawCaps, true);
            if (! is_array($decoded)) {
                throw ValidationException::withMessages([
                    'data.trip_inventory_caps' => 'Trip inventory caps must be a valid JSON object.',
                ]);
            }

            $rawCaps = $decoded;
        }

        $caps = [];
        foreach ($rawCaps as $tripId => $cap) {
            $tripIdString = (string) $tripId;
            if ($tripIdString === '') {
                continue;
            }

            if ($cap === null) {
                $caps[$tripIdString] = null;
                continue;
            }

            if (! is_numeric($cap) || (int) $cap < 0) {
                throw ValidationException::withMessages([
                    'data.trip_inventory_caps' => 'Each trip inventory cap must be a non-negative integer or null.',
                ]);
            }

            $caps[$tripIdString] = (int) $cap;
        }

        return $caps;
    }
}
