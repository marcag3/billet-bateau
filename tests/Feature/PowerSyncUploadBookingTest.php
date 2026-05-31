<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Product;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_booking_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $bookingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'bookings',
                    'id' => $bookingId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'trip_id' => $trip->getKey(),
                        'contact_name' => 'Walk-in Guest',
                        'contact_email' => 'walkin@example.com',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Walk-in Guest',
            'contact_email' => 'walkin@example.com',
        ]);
    }

    public function test_put_walk_in_booking_and_ticket_for_past_trip(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'booking_questions' => ['Dietary restrictions?'],
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->subHour(),
        ]);
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);
        $bookingId = (string) Str::ulid();
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'bookings',
                    'id' => $bookingId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'trip_id' => $trip->getKey(),
                        'contact_name' => 'Walk-in Guest',
                        'contact_email' => 'walkin@example.com',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $bookingId,
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Walk-in Guest',
                        'email' => 'walkin@example.com',
                        'country' => '',
                        'custom_fields' => ['Dietary restrictions?' => 'None'],
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'trip_id' => $trip->getKey(),
        ]);
        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicketId,
            'booking_id' => $bookingId,
        ]);
    }

    public function test_put_booking_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $bookingId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'bookings',
                    'id' => $bookingId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'trip_id' => $trip->getKey(),
                        'contact_name' => 'Walk-in Guest',
                        'contact_email' => 'walkin@example.com',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('bookings', ['id' => $bookingId]);
    }

    public function test_delete_booking_without_tickets_succeeds(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('bookings', ['id' => $booking->getKey()]);
    }

    public function test_delete_booking_with_tickets_is_rejected(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);
        BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('bookings', ['id' => $booking->getKey()]);
    }

    public function test_put_booking_ticket_rejects_capacity_exceeded(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $product = Product::factory()->create([
            'program_id' => $program->getKey(),
            'capacity' => 1,
        ]);
        $trip = Trip::factory()->forProduct($product)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);
        $existingBooking = Booking::factory()->forTrip($trip)->create();
        BookingTicket::factory()->create([
            'booking_id' => $existingBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $bookingId = (string) Str::ulid();
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'bookings',
                    'id' => $bookingId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'trip_id' => $trip->getKey(),
                        'contact_name' => 'Another Guest',
                        'contact_email' => 'another@example.com',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $bookingId,
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Another Guest',
                        'email' => 'another@example.com',
                        'country' => '',
                        'custom_fields' => [],
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('bookings', ['id' => $bookingId]);
        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_booking_ticket_requires_custom_question_answers(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'booking_questions' => ['Dietary restrictions?'],
        ]);
        $trip = Trip::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);
        $bookingId = (string) Str::ulid();
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'bookings',
                    'id' => $bookingId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'trip_id' => $trip->getKey(),
                        'contact_name' => 'Walk-in Guest',
                        'contact_email' => 'walkin@example.com',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $bookingId,
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Walk-in Guest',
                        'email' => 'walkin@example.com',
                        'country' => '',
                        'custom_fields' => [],
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }
}
