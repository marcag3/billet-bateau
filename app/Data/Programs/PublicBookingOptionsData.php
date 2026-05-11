<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Data;

final class PublicBookingOptionsData extends Data
{
    /**
     * @param  list<PublicBookingTripOptionData>  $trips
     * @param  list<PublicBookingTicketTypeOptionData>  $ticket_types
     */
    public function __construct(
        public array $trips,
        public array $ticket_types,
    ) {}
}
