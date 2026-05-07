<?php

namespace App\Data\PowerSync\BookingTickets;

use App\Models\BookingTicket;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;

/**
 * Merges PowerSync booking_tickets PUT payloads with an optional existing row.
 *
 * @return array{
 *     booking_id: string,
 *     ticket_type_id: string,
 *     name: string,
 *     email: string,
 *     country: string,
 *     custom_fields: array<string, mixed>,
 *     waiver_confirmation_id: string|null
 * }
 */
final class BookingTicketPutPayloadResolver
{
    /**
     * @return array{
     *     booking_id: string,
     *     ticket_type_id: string,
     *     name: string,
     *     email: string,
     *     country: string,
     *     custom_fields: array<string, mixed>,
     *     waiver_confirmation_id: string|null
     * }
     */
    public static function resolve(BookingTicketPutData $dto, ?BookingTicket $existing): array
    {
        $bookingId = $dto->booking_id instanceof Optional ? ($existing?->booking_id ?? null) : $dto->booking_id;
        $ticketTypeId = $dto->ticket_type_id instanceof Optional ? ($existing?->ticket_type_id ?? null) : $dto->ticket_type_id;

        if ($bookingId === null || $bookingId === '') {
            throw ValidationException::withMessages([
                'data.booking_id' => 'Booking is required.',
            ]);
        }

        if ($ticketTypeId === null || $ticketTypeId === '') {
            throw ValidationException::withMessages([
                'data.ticket_type_id' => 'Ticket type is required.',
            ]);
        }

        $name = $dto->name instanceof Optional ? ($existing?->name ?? null) : $dto->name;
        $email = $dto->email instanceof Optional ? ($existing?->email ?? null) : $dto->email;
        $country = $dto->country instanceof Optional ? ($existing?->country ?? null) : $dto->country;
        $customFields = $dto->custom_fields instanceof Optional
            ? (is_array($existing?->custom_fields) ? $existing->custom_fields : [])
            : self::normalizeCustomFields($dto->custom_fields);
        $waiverConfirmationId = $dto->waiver_confirmation_id instanceof Optional
            ? $existing?->waiver_confirmation_id
            : $dto->waiver_confirmation_id;

        return [
            'booking_id' => $bookingId,
            'ticket_type_id' => $ticketTypeId,
            'name' => $name,
            'email' => $email,
            'country' => $country,
            'custom_fields' => $customFields,
            'waiver_confirmation_id' => $waiverConfirmationId,
        ];
    }

    /**
     * @param  array<string, mixed>|string|null  $rawFields
     * @return array<string, mixed>
     */
    private static function normalizeCustomFields(array|string|null $rawFields): array
    {
        if ($rawFields === null) {
            return [];
        }

        if (is_array($rawFields)) {
            return $rawFields;
        }

        if ($rawFields === '') {
            return [];
        }

        $decoded = json_decode($rawFields, true);
        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'data.custom_fields' => 'Custom fields must be a valid JSON object.',
            ]);
        }

        return $decoded;
    }
}
