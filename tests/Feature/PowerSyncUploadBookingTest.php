<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Product;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Notifications\BookingModifiedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
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

    public function test_put_creates_walk_in_booking_without_contact_email(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
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
                        'contact_email' => null,
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
                        'email' => null,
                        'country' => 'CA',
                        'custom_fields' => [],
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'contact_name' => 'Walk-in Guest',
            'contact_email' => null,
        ]);
        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicketId,
            'booking_id' => $bookingId,
            'email' => null,
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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

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

        $this->assertSoftDeleted('bookings', ['id' => $booking->getKey()]);
    }

    public function test_patch_restores_soft_deleted_booking_when_trip_changes(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $tripA = Trip::factory()->forProgram($program)->create();
        $tripB = Trip::factory()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($tripA)->create();
        $booking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'trip_id' => $tripB->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->getKey(),
            'trip_id' => $tripB->getKey(),
            'deleted_at' => null,
        ]);
    }

    public function test_patch_rebook_rejects_trip_at_capacity(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $product = Product::factory()->create([
            'program_id' => $program->getKey(),
            'capacity' => 1,
        ]);
        $tripA = Trip::factory()->forProgram($program)->create();
        $tripB = Trip::factory()->forProduct($product)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);

        $occupyingBooking = Booking::factory()->forTrip($tripB)->create();
        BookingTicket::factory()->create([
            'booking_id' => $occupyingBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $cancelledBooking = Booking::factory()->forTrip($tripA)->create();
        BookingTicket::factory()->create([
            'booking_id' => $cancelledBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);
        $cancelledBooking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $cancelledBooking->getKey(),
                    'data' => [
                        'trip_id' => $tripB->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertSoftDeleted('bookings', [
            'id' => $cancelledBooking->getKey(),
            'trip_id' => $tripA->getKey(),
        ]);
    }

    public function test_patch_rebook_restores_when_target_has_capacity(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $product = Product::factory()->create([
            'program_id' => $program->getKey(),
            'capacity' => 2,
        ]);
        $tripA = Trip::factory()->forProgram($program)->create();
        $tripB = Trip::factory()->forProduct($product)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);

        $occupyingBooking = Booking::factory()->forTrip($tripB)->create();
        BookingTicket::factory()->create([
            'booking_id' => $occupyingBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $cancelledBooking = Booking::factory()->forTrip($tripA)->create();
        BookingTicket::factory()->create([
            'booking_id' => $cancelledBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);
        $cancelledBooking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $cancelledBooking->getKey(),
                    'data' => [
                        'trip_id' => $tripB->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $cancelledBooking->getKey(),
            'trip_id' => $tripB->getKey(),
            'deleted_at' => null,
        ]);
    }

    public function test_patch_restores_soft_deleted_booking_in_place_via_deleted_at(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $booking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'deleted_at' => null,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->getKey(),
            'trip_id' => $trip->getKey(),
            'deleted_at' => null,
        ]);
    }

    public function test_patch_restore_in_place_rejects_when_trip_at_capacity(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $product = Product::factory()->create([
            'program_id' => $program->getKey(),
            'capacity' => 1,
        ]);
        $trip = Trip::factory()->forProduct($product)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);

        $occupyingBooking = Booking::factory()->forTrip($trip)->create();
        BookingTicket::factory()->create([
            'booking_id' => $occupyingBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $cancelledBooking = Booking::factory()->forTrip($trip)->create();
        BookingTicket::factory()->create([
            'booking_id' => $cancelledBooking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);
        $cancelledBooking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $cancelledBooking->getKey(),
                    'data' => [
                        'deleted_at' => null,
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertSoftDeleted('bookings', [
            'id' => $cancelledBooking->getKey(),
            'trip_id' => $trip->getKey(),
        ]);
    }

    public function test_patch_restore_in_place_rejects_when_cancelled_by_voyage(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create();
        $booking = Booking::factory()->forTrip($trip)->create([
            'cancelled_by_voyage_id' => $voyage->getKey(),
        ]);
        $booking->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'deleted_at' => null,
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertSoftDeleted('bookings', [
            'id' => $booking->getKey(),
            'cancelled_by_voyage_id' => $voyage->getKey(),
        ]);
    }

    public function test_patch_can_soft_delete_booking_via_deleted_at(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $deletedAt = now()->toIso8601String();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'deleted_at' => $deletedAt,
                    ],
                ],
            ],
        ])->assertOk();

        $booking->refresh();
        $this->assertTrue($booking->trashed());
        $this->assertNull($booking->cancelled_by_voyage_id);
    }

    public function test_patch_manual_soft_delete_clears_trip_cancellation_attribution(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create();
        $booking = Booking::factory()->forTrip($trip)->create([
            'cancelled_by_voyage_id' => $voyage->getKey(),
        ]);
        $deletedAt = now()->toIso8601String();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'deleted_at' => $deletedAt,
                    ],
                ],
            ],
        ])->assertOk();

        $booking->refresh();
        $this->assertTrue($booking->trashed());
        $this->assertNull($booking->cancelled_by_voyage_id);
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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

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
        ])->assertOk()
            ->assertJsonPath('results.0.status', 'applied')
            ->assertJsonPath('results.1.status', 'rejected');

        $this->assertDatabaseHas('bookings', ['id' => $bookingId]);
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
        ])->assertOk()
            ->assertJsonPath('results.0.status', 'applied')
            ->assertJsonPath('results.1.status', 'rejected');

        $this->assertDatabaseHas('bookings', ['id' => $bookingId]);
        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_patch_booking_sends_modified_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $tripA = Trip::factory()->forProgram($program)->create();
        $tripB = Trip::factory()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($tripA)->create([
            'contact_email' => 'guest@example.com',
            'contact_name' => 'Guest One',
            'contact_locale' => 'en',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'trip_id' => $tripB->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        Notification::assertSentOnDemand(
            BookingModifiedNotification::class,
            function (BookingModifiedNotification $notification) use ($booking, $tripB): bool {
                return $notification->booking->getKey() === $booking->getKey()
                    && (string) $notification->booking->trip_id === (string) $tripB->getKey();
            },
        );
    }

    public function test_patch_booking_without_email_does_not_send_modified_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $tripA = Trip::factory()->forProgram($program)->create();
        $tripB = Trip::factory()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($tripA)->create([
            'contact_email' => null,
            'contact_name' => 'Walk-in Guest',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'trip_id' => $tripB->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_put_create_booking_does_not_send_modified_notification(): void
    {
        Notification::fake();

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

        Notification::assertNothingSent();
    }

    public function test_patch_soft_delete_does_not_send_modified_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create([
            'contact_email' => 'guest@example.com',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'deleted_at' => now()->toIso8601String(),
                    ],
                ],
            ],
        ])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_patch_booking_ticket_sends_single_modified_notification_per_batch(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'booking_questions' => ['Dietary restrictions?'],
        ]);
        $trip = Trip::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create(['program_id' => $program->getKey()]);
        $booking = Booking::factory()->forTrip($trip)->create([
            'contact_email' => 'guest@example.com',
            'contact_name' => 'Guest One',
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
            'custom_fields' => ['Dietary restrictions?' => 'None'],
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'bookings',
                    'id' => $booking->getKey(),
                    'data' => [
                        'contact_name' => 'Guest Updated',
                    ],
                ],
                [
                    'op' => 'PATCH',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                    'data' => [
                        'custom_fields' => ['Dietary restrictions?' => 'Vegetarian'],
                    ],
                ],
            ],
        ])->assertOk();

        Notification::assertSentOnDemandTimes(BookingModifiedNotification::class, 1);
    }
}
