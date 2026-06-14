<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\TicketType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BookingTicket>
 */
class BookingTicketFactory extends Factory
{
    protected $model = BookingTicket::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'booking_id' => Booking::factory(),
            'ticket_type_id' => TicketType::factory(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'country' => fake()->countryCode(),
            'custom_fields' => [],
            'waiver_confirmation_id' => null,
        ];
    }
}
