<?php

namespace App\Data\PowerSync\Passengers;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class PassengerPutData extends Data
{
    public function __construct(
        public string|Optional|null $voyage_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public string|Optional|null $booking_id = new Optional,
        public string|Optional|null $check_in_id = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $notes = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'voyage_id' => ['sometimes', 'nullable', 'ulid', 'exists:voyages,id'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'booking_id' => ['sometimes', 'nullable', 'ulid', 'exists:bookings,id'],
            'check_in_id' => ['sometimes', 'nullable', 'ulid', 'exists:check_ins,id'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
