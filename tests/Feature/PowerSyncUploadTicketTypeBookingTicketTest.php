<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadTicketTypeBookingTicketTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_ticket_type_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketTypeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'title' => 'Adult',
                        'price_cents' => 1999,
                        'is_pay_what_you_can' => false,
                        'min_per_purchase' => 1,
                        'max_per_purchase' => 6,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketTypeId,
            'program_id' => $program->getKey(),
            'title' => 'Adult',
            'price_cents' => 1999,
            'is_pay_what_you_can' => false,
            'min_per_purchase' => 1,
            'max_per_purchase' => 6,
        ]);
    }

    public function test_put_ticket_type_forbids_non_member_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $ticketTypeId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketTypeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'title' => 'Intruder ticket',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('ticket_types', ['id' => $ticketTypeId]);
    }

    public function test_put_creates_booking_ticket_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();
        $waiverConfirmationId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Alice Doe',
                        'email' => 'alice@example.com',
                        'country' => 'CA',
                        'custom_fields' => ['food' => 'none'],
                        'waiver_confirmation_id' => $waiverConfirmationId,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicketId,
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
            'name' => 'Alice Doe',
            'email' => 'alice@example.com',
            'country' => 'CA',
            'waiver_confirmation_id' => $waiverConfirmationId,
        ]);
    }

    public function test_put_booking_ticket_rejects_ticket_type_outside_booking_program(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->withOwner($user)->create();
        $programB = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($programA)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $programB->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Mismatch',
                        'email' => 'mismatch@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_delete_removes_booking_ticket_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicket->getKey()]);
    }

    public function test_delete_booking_ticket_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('booking_tickets', ['id' => $bookingTicket->getKey()]);
    }

    public function test_delete_ticket_type_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('ticket_types', ['id' => $ticketType->getKey()]);
    }

    public function test_put_forbids_non_member_from_overwriting_existing_ticket_type(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
            'title' => 'Original',
        ]);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                    'data' => [
                        'title' => 'Hacked',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketType->getKey(),
            'title' => 'Original',
        ]);
    }

    public function test_put_booking_ticket_forbids_non_member_of_booking_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Guest',
                        'email' => 'guest@example.com',
                        'country' => 'US',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_patch_updates_owned_ticket_type(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
            'title' => 'Child',
            'price_cents' => 1000,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                    'data' => [
                        'title' => 'Youth',
                        'price_cents' => 1500,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketType->getKey(),
            'title' => 'Youth',
            'price_cents' => 1500,
        ]);
    }

    public function test_patch_ticket_type_forbids_changing_program_id(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->withOwner($user)->create();
        $programB = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $programA->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                    'data' => [
                        'program_id' => $programB->getKey(),
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketType->getKey(),
            'program_id' => $programA->getKey(),
        ]);
    }

    public function test_patch_ticket_type_rejects_max_less_than_min_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
            'min_per_purchase' => 3,
            'max_per_purchase' => 10,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                    'data' => [
                        'max_per_purchase' => 1,
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketType->getKey(),
            'max_per_purchase' => 10,
        ]);
    }

    public function test_patch_updates_booking_ticket(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
            'name' => 'Bob',
            'email' => 'bob@example.com',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                    'data' => [
                        'name' => 'Robert',
                        'email' => 'robert@example.com',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicket->getKey(),
            'name' => 'Robert',
            'email' => 'robert@example.com',
        ]);
    }

    public function test_patch_booking_ticket_rejects_ticket_type_outside_booking_program(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->withOwner($user)->create();
        $programB = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($programA)->create();
        $ticketTypeA = TicketType::factory()->create([
            'program_id' => $programA->getKey(),
        ]);
        $ticketTypeB = TicketType::factory()->create([
            'program_id' => $programB->getKey(),
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketTypeA->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                    'data' => [
                        'ticket_type_id' => $ticketTypeB->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicket->getKey(),
            'ticket_type_id' => $ticketTypeA->getKey(),
        ]);
    }

    public function test_delete_removes_ticket_type_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('ticket_types', ['id' => $ticketType->getKey()]);
    }

    public function test_delete_ticket_type_unprocessable_when_booking_tickets_reference_it(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('ticket_types', ['id' => $ticketType->getKey()]);
    }

    public function test_put_new_ticket_type_without_program_id_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $ticketTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketTypeId,
                    'data' => [
                        'title' => 'No program',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('ticket_types', ['id' => $ticketTypeId]);
    }

    public function test_put_new_ticket_type_without_title_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketTypeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'price_cents' => 500,
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('ticket_types', ['id' => $ticketTypeId]);
    }

    public function test_put_ticket_type_rejects_max_less_than_min_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketTypeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'title' => 'Bad limits',
                        'min_per_purchase' => 5,
                        'max_per_purchase' => 2,
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('ticket_types', ['id' => $ticketTypeId]);
    }

    public function test_put_booking_ticket_rejects_unknown_booking_id_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();
        $unknownBookingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $unknownBookingId,
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'X',
                        'email' => 'x@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_booking_ticket_rejects_unknown_ticket_type_id_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $bookingTicketId = (string) Str::ulid();
        $unknownTicketTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $unknownTicketTypeId,
                        'name' => 'X',
                        'email' => 'x@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_booking_ticket_rejects_invalid_email_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'X',
                        'email' => 'not-an-email',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_new_booking_ticket_without_name_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'email' => 'only@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_booking_ticket_rejects_invalid_booking_id_ulid_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => 'not-a-ulid',
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'X',
                        'email' => 'x@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_put_updates_existing_ticket_type_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
            'title' => 'Old',
            'price_cents' => 800,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $ticketType->getKey(),
                    'data' => [
                        'title' => 'New',
                        'price_cents' => 900,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('ticket_types', [
            'id' => $ticketType->getKey(),
            'program_id' => $program->getKey(),
            'title' => 'New',
            'price_cents' => 900,
        ]);
    }

    public function test_put_updates_existing_booking_ticket_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicket = BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $ticketType->getKey(),
            'name' => 'Pat',
            'email' => 'pat@example.com',
            'country' => 'US',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicket->getKey(),
                    'data' => [
                        'name' => 'Patricia',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicket->getKey(),
            'name' => 'Patricia',
            'email' => 'pat@example.com',
            'country' => 'CA',
        ]);
    }

    public function test_put_booking_ticket_accepts_custom_fields_as_json_string(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Sam',
                        'email' => 'sam@example.com',
                        'country' => 'CA',
                        'custom_fields' => json_encode(['size' => 'L'], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $bookingTicketId,
        ]);
        $row = BookingTicket::query()->whereKey($bookingTicketId)->first();
        $this->assertNotNull($row);
        $this->assertSame(['size' => 'L'], $row->custom_fields);
    }

    public function test_put_booking_ticket_rejects_invalid_custom_fields_json_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $bookingTicketId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'Sam',
                        'email' => 'sam@example.com',
                        'country' => 'CA',
                        'custom_fields' => '{bad',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
    }

    public function test_patch_on_missing_ticket_type_is_no_op(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $missingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'ticket_types',
                    'id' => $missingId,
                    'data' => [
                        'title' => 'Ghost',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('ticket_types', ['id' => $missingId]);
    }

    public function test_patch_on_missing_booking_ticket_is_no_op(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $missingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'booking_tickets',
                    'id' => $missingId,
                    'data' => [
                        'name' => 'Ghost',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('booking_tickets', ['id' => $missingId]);
    }

    public function test_delete_on_missing_booking_ticket_is_no_op(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $missingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'booking_tickets',
                    'id' => $missingId,
                ],
            ],
        ])->assertOk();
    }

    public function test_delete_on_missing_ticket_type_is_no_op(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $missingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'ticket_types',
                    'id' => $missingId,
                ],
            ],
        ])->assertOk();
    }

    public function test_batch_rolls_back_when_later_entry_fails(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $booking = Booking::factory()->forProgram($program)->create();
        $ticketType = TicketType::factory()->create([
            'program_id' => $program->getKey(),
        ]);
        $newTicketTypeId = (string) Str::ulid();
        $bookingTicketId = (string) Str::ulid();
        $unknownBookingId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'ticket_types',
                    'id' => $newTicketTypeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'title' => 'Batch first',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'booking_tickets',
                    'id' => $bookingTicketId,
                    'data' => [
                        'booking_id' => $unknownBookingId,
                        'ticket_type_id' => $ticketType->getKey(),
                        'name' => 'X',
                        'email' => 'x@example.com',
                        'country' => 'CA',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('ticket_types', ['id' => $newTicketTypeId]);
        $this->assertDatabaseMissing('booking_tickets', ['id' => $bookingTicketId]);
        $this->assertDatabaseHas('bookings', ['id' => $booking->getKey()]);
    }
}
