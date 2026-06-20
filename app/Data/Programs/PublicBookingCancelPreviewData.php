<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Data;

final class PublicBookingCancelPreviewData extends Data
{
    public function __construct(
        public string $id,
        public string $program_name,
        public string $contact_name,
        public string $departure_at,
        public string $ticket_summary,
        public ?string $product_name,
        public ?string $product_description,
        public ?string $product_banner_url,
        public ?string $boat_type_banner_url,
    ) {}
}
