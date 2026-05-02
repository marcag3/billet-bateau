<?php

namespace App\Data\PowerSync\TemplateDaySlots;

use App\Data\PowerSync\Support\PowerSyncCrudInnerDataValidator;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\TemplateDaySlot;
use Illuminate\Validation\ValidationException;

/**
 * @return array{sort_order: int, departure_time: string, capacity: int, boat_type_id: ?string, water_route_id: ?string, internal_notes: ?string, ticket_setup: ?array}
 */
final class TemplateDaySlotPutPayloadResolver
{
    public static function resolve(TemplateDaySlotPutData $dto, ?TemplateDaySlot $existing): array
    {
        $sortOrder = PowerSyncOptional::resolve($dto->sort_order, $existing?->sort_order);
        $departureTime = PowerSyncOptional::resolve($dto->departure_time, $existing?->departure_time);
        $capacity = PowerSyncOptional::resolve($dto->capacity, $existing?->capacity);
        $boatTypeId = PowerSyncOptional::resolve($dto->boat_type_id, $existing?->boat_type_id);
        $waterRouteId = PowerSyncOptional::resolve($dto->water_route_id, $existing?->water_route_id);
        $internalNotes = PowerSyncOptional::resolve($dto->internal_notes, $existing?->internal_notes);
        $rawTicketSetup = PowerSyncOptional::resolve($dto->ticket_setup, $existing?->ticket_setup);
        $ticketSetup = self::normalizeTicketSetup($rawTicketSetup);

        PowerSyncCrudInnerDataValidator::validate(
            [
                'sort_order' => $sortOrder,
                'departure_time' => $departureTime,
                'capacity' => $capacity,
                'internal_notes' => $internalNotes,
            ],
            [
                'sort_order' => ['required', 'integer', 'min:0'],
                'departure_time' => ['required', 'string', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/'],
                'capacity' => ['required', 'integer', 'min:1'],
                'internal_notes' => ['nullable', 'string', 'max:2000'],
            ],
        );

        self::validateTicketSetup($ticketSetup);

        return [
            'sort_order' => (int) $sortOrder,
            'departure_time' => (string) $departureTime,
            'capacity' => (int) $capacity,
            'boat_type_id' => $boatTypeId,
            'water_route_id' => $waterRouteId,
            'internal_notes' => $internalNotes !== null ? (string) $internalNotes : null,
            'ticket_setup' => $ticketSetup,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function normalizeTicketSetup(mixed $value): ?array
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

    private static function validateTicketSetup(?array $ticketSetup): void
    {
        if ($ticketSetup === null) {
            return;
        }

        $errors = [];

        if (! array_key_exists('policy', $ticketSetup) || ! in_array($ticketSetup['policy'] ?? null, ['defaults', 'custom'], true)) {
            $errors[] = 'ticket_setup.policy must be "defaults" or "custom".';
        }

        if (($ticketSetup['policy'] ?? null) === 'custom') {
            if (empty($ticketSetup['allowed_ticket_type_ids']) || ! is_array($ticketSetup['allowed_ticket_type_ids'])) {
                $errors[] = 'ticket_setup.allowed_ticket_type_ids is required when policy is "custom".';
            }
        }

        if (array_key_exists('min_per_booking', $ticketSetup)) {
            $min = $ticketSetup['min_per_booking'];
            if (! is_int($min) || $min < 0) {
                $errors[] = 'ticket_setup.min_per_booking must be a non-negative integer.';
            }
        }

        if (array_key_exists('max_per_booking', $ticketSetup)) {
            $max = $ticketSetup['max_per_booking'];
            if (! is_int($max) || $max < 0) {
                $errors[] = 'ticket_setup.max_per_booking must be a non-negative integer.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'data.ticket_setup' => $errors,
            ]);
        }
    }
}
