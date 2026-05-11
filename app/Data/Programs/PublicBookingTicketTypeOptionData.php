<?php

namespace App\Data\Programs;

use App\Models\TicketType;
use Spatie\LaravelData\Data;

final class PublicBookingTicketTypeOptionData extends Data
{
    public function __construct(
        public string $id,
        public string $title,
        public ?int $price_cents,
        public bool $is_pay_what_you_can,
        public int $min_per_purchase,
        public ?int $max_per_purchase,
    ) {}

    public static function fromModel(TicketType $ticketType): self
    {
        return new self(
            id: (string) $ticketType->getKey(),
            title: (string) $ticketType->title,
            price_cents: $ticketType->price_cents,
            is_pay_what_you_can: (bool) $ticketType->is_pay_what_you_can,
            min_per_purchase: (int) $ticketType->min_per_purchase,
            max_per_purchase: $ticketType->max_per_purchase,
        );
    }
}
