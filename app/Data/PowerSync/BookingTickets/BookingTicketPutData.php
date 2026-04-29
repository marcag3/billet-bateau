<?php

namespace App\Data\PowerSync\BookingTickets;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync booking_tickets PUT (inner {@code data} object).
 */
final class BookingTicketPutData extends Data
{
    /**
     * @param  array<string, mixed>|string|Optional  $custom_fields
     */
    public function __construct(
        public string|Optional|null $booking_id = new Optional,
        public string|Optional|null $ticket_type_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $email = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $country = new Optional,
        public array|string|Optional $custom_fields = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $waiver_confirmation_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'booking_id' => ['sometimes', 'nullable', 'ulid', 'exists:bookings,id'],
            'ticket_type_id' => ['sometimes', 'nullable', 'ulid', 'exists:ticket_types,id'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:255'],
            'custom_fields' => ['sometimes'],
            'waiver_confirmation_id' => ['sometimes', 'nullable', 'ulid'],
        ];
    }
}
