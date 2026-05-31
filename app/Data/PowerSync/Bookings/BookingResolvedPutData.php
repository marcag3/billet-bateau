<?php

namespace App\Data\PowerSync\Bookings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync bookings PUT before persistence.
 */
final class BookingResolvedPutData extends Data
{
    public function __construct(
        public string $trip_id,
        public string $contact_name,
        public string $contact_email,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'trip_id' => ['required', 'ulid', 'exists:trips,id'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['required', 'email:rfc', 'max:255'],
        ];
    }
}
