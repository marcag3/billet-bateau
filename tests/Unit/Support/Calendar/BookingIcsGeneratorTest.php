<?php

namespace Tests\Unit\Support\Calendar;

use App\Models\Booking;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\WaterRoute;
use App\Support\Calendar\BookingIcsGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingIcsGeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_includes_event_with_route_duration(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['name' => 'Harbor Tours']);
        $route = WaterRoute::factory()->create([
            'program_id' => $program->getKey(),
            'duration_minutes' => 90,
        ]);
        $departure = now()->addWeek()->startOfMinute();
        $trip = Trip::factory()
            ->forProgram($program)
            ->withWaterRoute($route)
            ->create(['scheduled_departure_at' => $departure]);
        $trip->product->forceFill(['name' => 'Sunset run'])->save();

        $booking = Booking::factory()->forTrip($trip)->create([
            'contact_name' => 'Alex River',
        ]);

        $booking->load([
            'program',
            'trip.product.waterRoute',
            'bookingTickets.ticketType',
        ]);

        $ics = (new BookingIcsGenerator)->generate($booking);

        $this->assertNotNull($ics);
        $this->assertStringContainsString('BEGIN:VCALENDAR', $ics);
        $this->assertStringContainsString('BEGIN:VEVENT', $ics);
        $this->assertStringContainsString('Harbor Tours — Sunset run', $ics);
        $this->assertStringContainsString('booking-'.$booking->getKey().'@', $ics);

        $expectedEnd = $departure->copy()->timezone('America/Toronto')->addMinutes(90);
        $this->assertStringContainsString(
            $expectedEnd->format('Ymd\THis'),
            $ics,
        );
    }

    public function test_generate_returns_null_without_scheduled_departure(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create();
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);

        $booking = Booking::factory()->forTrip($trip)->create();
        $booking->load(['program', 'trip.product.waterRoute', 'bookingTickets.ticketType']);
        $booking->trip->scheduled_departure_at = null;

        $this->assertNull((new BookingIcsGenerator)->generate($booking));
    }

    public function test_generate_includes_program_city_in_location(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'city' => 'Montréal',
            'line_1' => '123 Quai',
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);

        $booking = Booking::factory()->forTrip($trip)->create();
        $booking->load(['program', 'trip.product.waterRoute', 'bookingTickets.ticketType']);

        $ics = (new BookingIcsGenerator)->generate($booking);

        $this->assertNotNull($ics);
        $this->assertStringContainsString('Montréal', $ics);
        $this->assertStringContainsString('123 Quai', $ics);
    }
}
