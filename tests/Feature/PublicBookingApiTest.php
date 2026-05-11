<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_options_returns_trips_and_ticket_types(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'lake-tours',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDays(3),
            'capacity' => 20,
        ]);

        $type = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $r = $this->getJson('/api/public/programs/lake-tours/booking-options');
        $r->assertOk();
        $r->assertJsonPath('data.trips.0.id', $trip->getKey());
        $r->assertJsonPath('data.trips.0.capacity', 20);
        $r->assertJsonPath('data.trips.0.remaining_capacity', 20);
        $r->assertJsonPath('data.ticket_types.0.id', $type->getKey());
        $r->assertJsonPath('data.ticket_types.0.title', 'Adult');
    }

    public function test_booking_options_excludes_past_trips(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'past-only',
        ]);

        Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->subDay(),
            'capacity' => 10,
        ]);

        $this->getJson('/api/public/programs/past-only/booking-options')
            ->assertOk()
            ->assertJsonCount(0, 'data.trips');
    }

    public function test_store_creates_booking_and_booking_tickets(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'book-me',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
            'capacity' => 10,
        ]);

        $type = TicketType::factory()->forProgram($program)->create([
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $payload = [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [
                (string) $type->getKey() => 2,
            ],
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
        ];

        $r = $this->postJson('/api/public/programs/book-me/bookings', $payload);
        $r->assertCreated();
        $r->assertJsonPath('data.total_tickets', 2);
        $r->assertJsonPath('data.contact_email', 'alex@example.com');

        $bookingId = $r->json('data.id');
        $this->assertNotEmpty($bookingId);
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'trip_id' => $trip->getKey(),
            'contact_email' => 'alex@example.com',
        ]);
        $this->assertSame(2, BookingTicket::query()->where('booking_id', $bookingId)->count());
    }

    public function test_store_rejects_trip_from_other_program(): void
    {
        $u = User::factory()->create();
        $programA = Program::factory()->withOwner($u)->create(['slug' => 'prog-a']);
        $programB = Program::factory()->withOwner($u)->create(['slug' => 'prog-b']);

        $tripB = Trip::factory()->forProgram($programB)->create([
            'scheduled_departure_at' => now()->addWeek(),
            'capacity' => 10,
        ]);

        $typeA = TicketType::factory()->forProgram($programA)->create();

        $this->postJson('/api/public/programs/prog-a/bookings', [
            'trip_id' => $tripB->getKey(),
            'ticket_quantities' => [(string) $typeA->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors(['trip_id']);
    }

    public function test_store_rejects_when_no_tickets_selected(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'zero']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
            'capacity' => 10,
        ]);
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/zero/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 0],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors(['ticket_quantities']);
    }

    public function test_store_rejects_when_over_trip_capacity(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'full']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
            'capacity' => 2,
        ]);
        $type = TicketType::factory()->forProgram($program)->create([
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $existing = Booking::factory()->forTrip($trip)->create();
        BookingTicket::factory()->create([
            'booking_id' => $existing->getKey(),
            'ticket_type_id' => $type->getKey(),
        ]);
        BookingTicket::factory()->create([
            'booking_id' => $existing->getKey(),
            'ticket_type_id' => $type->getKey(),
        ]);

        $this->postJson('/api/public/programs/full/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors(['ticket_quantities']);
    }

    public function test_store_validates_contact_email(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'bad-mail']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
            'capacity' => 10,
        ]);
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/bad-mail/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'not-an-email',
        ])->assertUnprocessable()->assertJsonValidationErrors(['contact_email']);
    }
}
