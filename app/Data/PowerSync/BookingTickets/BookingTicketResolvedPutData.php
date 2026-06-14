<?php

namespace App\Data\PowerSync\BookingTickets;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync booking_tickets PUT before persistence.
 */
final class BookingTicketResolvedPutData extends Data
{
    /**
     * @param  array<string, mixed>  $custom_fields
     */
    public function __construct(
        public string $booking_id,
        public string $ticket_type_id,
        public string $name,
        public string $email,
        public string $country,
        public array $custom_fields,
        public ?string $waiver_confirmation_id,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'booking_id' => ['required', 'ulid', 'exists:bookings,id'],
            'ticket_type_id' => ['required', 'ulid', 'exists:ticket_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'country' => ['present', 'string', 'max:255'],
            'custom_fields' => ['present', 'array'],
            'waiver_confirmation_id' => ['nullable', 'ulid'],
        ];
    }
}
