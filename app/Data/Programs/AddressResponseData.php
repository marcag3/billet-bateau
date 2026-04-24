<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Data;

final class AddressResponseData extends Data
{
    public function __construct(
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
    ) {}
}
