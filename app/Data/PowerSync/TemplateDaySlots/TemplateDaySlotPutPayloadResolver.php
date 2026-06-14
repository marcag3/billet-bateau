<?php

namespace App\Data\PowerSync\TemplateDaySlots;

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
}
