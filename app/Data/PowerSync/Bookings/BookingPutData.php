<?php

namespace App\Data\PowerSync\Bookings;

use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync bookings PUT (inner {@code data} object).
 */
final class BookingPutData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public string|Optional|null $trip_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $contact_name = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $contact_email = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid'],
            'trip_id' => ['sometimes', 'nullable', 'ulid', 'exists:trips,id'],
            'contact_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
        ];
    }
}
