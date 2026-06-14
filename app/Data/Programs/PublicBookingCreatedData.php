<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Data;

final class PublicBookingCreatedData extends Data
{
    public function __construct(
        public string $id,
        public string $trip_id,
        public int $total_tickets,
        public string $contact_name,
        public string $contact_email,
    ) {}
}
