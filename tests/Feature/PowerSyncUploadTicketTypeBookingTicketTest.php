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
        $program = Program::factory()->for($user)->create();
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
                        'trip_inventory_caps' => [
                            (string) Str::ulid() => 30,
                        ],
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
        $program = Program::factory()->for($owner)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $programA = Program::factory()->for($user)->create();
        $programB = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($user)->create();
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
}
