<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\TicketTypes\TicketTypePatchData;
use App\Data\PowerSync\TicketTypes\TicketTypePutData;
use App\Data\PowerSync\TicketTypes\TicketTypePutPayloadResolver;
use App\Data\PowerSync\TicketTypes\TicketTypeResolvedPutData;
use App\Models\Program;
use App\Models\TicketType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see TicketType} rows (ticket_types upload type).
 *
 * Idempotent semantics: {@see PowerSyncCrudEntryData::OP_PATCH} and {@see PowerSyncCrudEntryData::OP_DELETE}
 * no-op when the target row does not exist (offline client retries safe).
 */
final class ApplyTicketTypePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
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

            if ($ticketType->bookingTickets()->exists()) {
                throw ValidationException::withMessages([
                    'id' => 'Cannot delete a ticket type that is still used by booking tickets.',
                ]);
            }

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

    private function applyPut(string $id, TicketTypePutData $dto, string $userId): void
    {
        $existing = TicketType::query()->whereKey($id)->first();

        $merged = TicketTypePutPayloadResolver::resolve($dto, $existing);
        $resolved = TicketTypeResolvedPutData::validateAndCreate($merged);

        $this->assertProgramManaged($resolved->program_id, $userId);
        $this->assertDependencyConfiguration(
            ticketTypeId: $id,
            programId: $resolved->program_id,
            dependsOnTicketTypeId: $resolved->depends_on_ticket_type_id,
            maxPerReferenceTicket: $resolved->max_per_reference_ticket,
        );

        TicketType::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved->program_id,
                'title' => $resolved->title,
                'price_cents' => $resolved->price_cents,
                'is_pay_what_you_can' => $resolved->is_pay_what_you_can,
                'min_per_purchase' => $resolved->min_per_purchase,
                'max_per_purchase' => $resolved->max_per_purchase,
                'depends_on_ticket_type_id' => $resolved->depends_on_ticket_type_id,
                'max_per_reference_ticket' => $resolved->max_per_reference_ticket,
            ],
        );
    }

    private function applyPatch(string $id, TicketTypePatchData $dto, string $userId): void
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

        if (! ($dto->depends_on_ticket_type_id instanceof Optional)) {
            $ticketType->depends_on_ticket_type_id = $dto->depends_on_ticket_type_id !== null && $dto->depends_on_ticket_type_id !== ''
                ? (string) $dto->depends_on_ticket_type_id
                : null;
        }

        if (! ($dto->max_per_reference_ticket instanceof Optional)) {
            $ticketType->max_per_reference_ticket = $dto->max_per_reference_ticket;
        }

        if ($ticketType->max_per_purchase !== null && $ticketType->max_per_purchase < $ticketType->min_per_purchase) {
            throw ValidationException::withMessages([
                'data.max_per_purchase' => 'Max per purchase must be greater than or equal to min per purchase.',
            ]);
        }

        $this->assertDependencyConfiguration(
            ticketTypeId: (string) $ticketType->getKey(),
            programId: (string) $ticketType->program_id,
            dependsOnTicketTypeId: $ticketType->depends_on_ticket_type_id,
            maxPerReferenceTicket: $ticketType->max_per_reference_ticket,
        );

        $ticketType->save();
    }

    private function assertProgramManaged(string $programId, string $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    private function assertDependencyConfiguration(
        string $ticketTypeId,
        string $programId,
        ?string $dependsOnTicketTypeId,
        ?int $maxPerReferenceTicket,
    ): void {
        $hasDependsOn = $dependsOnTicketTypeId !== null && $dependsOnTicketTypeId !== '';
        $hasMaxPerReference = $maxPerReferenceTicket !== null;

        if ($hasDependsOn !== $hasMaxPerReference) {
            throw ValidationException::withMessages([
                'data.depends_on_ticket_type_id' => 'Reference ticket type and max per reference must both be set or both be empty.',
            ]);
        }

        if (! $hasDependsOn) {
            return;
        }

        if ($dependsOnTicketTypeId === $ticketTypeId) {
            throw ValidationException::withMessages([
                'data.depends_on_ticket_type_id' => 'A ticket type cannot depend on itself.',
            ]);
        }

        $referenceTicketType = TicketType::query()
            ->whereKey($dependsOnTicketTypeId)
            ->where('program_id', $programId)
            ->first();

        if ($referenceTicketType === null) {
            throw ValidationException::withMessages([
                'data.depends_on_ticket_type_id' => 'The selected reference ticket type is not valid for this program.',
            ]);
        }
    }
}
