<?php

namespace App\Data\PowerSync\CheckIns;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class CheckInPutData extends Data
{
    public function __construct(
        public string|Optional|null $booking_id = new Optional,
        public string|Optional|null $voyage_id = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $notes = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'booking_id' => ['sometimes', 'nullable', 'ulid', 'exists:bookings,id'],
            'voyage_id' => ['sometimes', 'nullable', 'ulid', 'exists:voyages,id'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
