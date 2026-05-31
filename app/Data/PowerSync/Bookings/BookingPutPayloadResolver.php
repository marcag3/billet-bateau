<?php

namespace App\Data\PowerSync\Bookings;

use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Booking;
use Illuminate\Validation\ValidationException;

/**
 * Resolves merged PUT attributes for {@see Booking} PowerSync uploads (after program id is known).
 *
 * @return array{trip_id: string, contact_name: string, contact_email: string}
 */
final class BookingPutPayloadResolver
{
    /**
     * @return array{trip_id: string, contact_name: string, contact_email: string}
     */
    public static function resolve(BookingPutData $dto, ?Booking $existing): array
    {
        $tripId = PowerSyncOptional::resolve($dto->trip_id, $existing?->trip_id);
        $contactName = PowerSyncOptional::resolve($dto->contact_name, $existing?->contact_name);
        $contactEmail = PowerSyncOptional::resolve($dto->contact_email, $existing?->contact_email);

        if ($tripId === null || $tripId === '') {
            throw ValidationException::withMessages([
                'data.trip_id' => 'Trip is required.',
            ]);
        }

        if ($contactName === null || trim((string) $contactName) === '') {
            throw ValidationException::withMessages([
                'data.contact_name' => 'Contact name is required.',
            ]);
        }

        if ($contactEmail === null || trim((string) $contactEmail) === '') {
            throw ValidationException::withMessages([
                'data.contact_email' => 'Contact email is required.',
            ]);
        }

        return [
            'trip_id' => (string) $tripId,
            'contact_name' => trim((string) $contactName),
            'contact_email' => trim((string) $contactEmail),
        ];
    }
}
