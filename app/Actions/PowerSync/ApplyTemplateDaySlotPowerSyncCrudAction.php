<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\TemplateDaySlots\TemplateDaySlotPatchData;
use App\Data\PowerSync\TemplateDaySlots\TemplateDaySlotPutData;
use App\Data\PowerSync\TemplateDaySlots\TemplateDaySlotPutPayloadResolver;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use App\Models\WaterRoute;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyTemplateDaySlotPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $slot = TemplateDaySlot::query()->whereKey($id)->first();

            if ($slot === null) {
                return;
            }

            $programId = $this->programIdForTemplateDayId((string) $slot->template_day_id);
            $this->assertCanManageProgram($programId, $userId);

            $slot->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = TemplateDaySlotPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = TemplateDaySlotPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for template_day_slots: '.$op);
    }

    private function applyPut(string $id, TemplateDaySlotPutData $dto, string $userId): void
    {
        $existing = TemplateDaySlot::query()->whereKey($id)->first();

        $templateDayIdFromData = $dto->template_day_id instanceof Optional
            ? null
            : $dto->template_day_id;

        if ($existing !== null) {
            $templateDayId = (string) $existing->template_day_id;
            if ($templateDayIdFromData !== null && $templateDayIdFromData !== $templateDayId) {
                $this->assertTemplateDayMoveAllowed($templateDayId, $templateDayIdFromData);
                $templateDayId = $templateDayIdFromData;
            }
        } else {
            $templateDayId = $templateDayIdFromData;
            if ($templateDayId === null) {
                throw ValidationException::withMessages([
                    'data.template_day_id' => 'Template day is required.',
                ]);
            }
        }

        $programId = $this->programIdForTemplateDayId($templateDayId);
        if ($programId === null) {
            throw ValidationException::withMessages([
                'data.template_day_id' => 'Template day is required.',
            ]);
        }

        $this->assertCanManageProgram($programId, $userId);

        $resolved = TemplateDaySlotPutPayloadResolver::resolve($dto, $existing);

        $this->assertWaterRouteBelongsToProgram($resolved['water_route_id'], $programId);

        TemplateDaySlot::query()->updateOrCreate(
            ['id' => $id],
            [
                'template_day_id' => $templateDayId,
                'sort_order' => $resolved['sort_order'],
                'departure_time' => $resolved['departure_time'],
                'capacity' => $resolved['capacity'],
                'boat_type_id' => $resolved['boat_type_id'],
                'water_route_id' => $resolved['water_route_id'],
                'internal_notes' => $resolved['internal_notes'],
                'ticket_setup' => $resolved['ticket_setup'],
            ],
        );
    }

    private function applyPatch(string $id, TemplateDaySlotPatchData $patch, string $userId): void
    {
        $slot = TemplateDaySlot::query()->whereKey($id)->first();

        if ($slot === null) {
            return;
        }

        $programId = $this->programIdForTemplateDayId((string) $slot->template_day_id);
        if ($programId === null) {
            throw new AuthorizationException;
        }

        $this->assertCanManageProgram($programId, $userId);

        if (! ($patch->sort_order instanceof Optional)) {
            $slot->sort_order = $patch->sort_order;
        }

        if (! ($patch->departure_time instanceof Optional)) {
            $slot->departure_time = $patch->departure_time;
        }

        if (! ($patch->capacity instanceof Optional)) {
            $slot->capacity = $patch->capacity;
        }

        if (! ($patch->boat_type_id instanceof Optional)) {
            $slot->boat_type_id = $patch->boat_type_id;
        }

        if (! ($patch->water_route_id instanceof Optional)) {
            $this->assertWaterRouteBelongsToProgram($patch->water_route_id, $programId);
            $slot->water_route_id = $patch->water_route_id;
        }

        if (! ($patch->internal_notes instanceof Optional)) {
            $slot->internal_notes = $patch->internal_notes;
        }

        if (! ($patch->ticket_setup instanceof Optional)) {
            $normalized = $this->normalizeTicketSetupForPatch($patch->ticket_setup);
            $slot->ticket_setup = $normalized;
        }

        $slot->save();
    }

    private function assertTemplateDayMoveAllowed(string $fromTemplateDayId, string $toTemplateDayId): void
    {
        $fromProgram = $this->programIdForTemplateDayId($fromTemplateDayId);
        $toProgram = $this->programIdForTemplateDayId($toTemplateDayId);

        if ($fromProgram === null || $toProgram === null || $fromProgram !== $toProgram) {
            throw new AuthorizationException;
        }
    }

    private function programIdForTemplateDayId(string $templateDayId): ?string
    {
        $programId = TemplateDay::query()->whereKey($templateDayId)->value('program_id');

        return $programId !== null ? (string) $programId : null;
    }

    private function assertCanManageProgram(string $programId, string $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    private function assertWaterRouteBelongsToProgram(?string $waterRouteId, string $programId): void
    {
        if ($waterRouteId === null) {
            return;
        }

        $route = WaterRoute::query()->whereKey($waterRouteId)->first();

        if ($route === null || (string) $route->program_id !== $programId) {
            throw ValidationException::withMessages([
                'data.water_route_id' => 'Water route must belong to the same program.',
            ]);
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeTicketSetupForPatch(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (! is_array($decoded)) {
                throw ValidationException::withMessages([
                    'data.ticket_setup' => 'ticket_setup must be a valid JSON object.',
                ]);
            }

            return $decoded;
        }

        if (is_array($value)) {
            return $value;
        }

        throw ValidationException::withMessages([
            'data.ticket_setup' => 'ticket_setup must be an object or JSON string.',
        ]);
    }
}
