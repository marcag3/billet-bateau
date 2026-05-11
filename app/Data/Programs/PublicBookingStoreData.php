<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;

#[MergeValidationRules]
final class PublicBookingStoreData extends Data
{
    /**
     * @param  array<string, int>  $ticket_quantities
     */
    public function __construct(
        public string $trip_id,
        public array $ticket_quantities,
        public string $contact_name,
        public string $contact_email,
    ) {}

    /**
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        return [
            'trip_id' => ['required', 'ulid'],
            'ticket_quantities' => ['required', 'array'],
            'ticket_quantities.*' => ['integer', 'min:0'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['required', 'string', 'email', 'max:255'],
        ];
    }
}
