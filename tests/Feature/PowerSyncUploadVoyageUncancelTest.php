<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Notifications\BookingReactivationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PowerSyncUploadVoyageUncancelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Trip, 2: Voyage, 3: Booking}
     */
    private function readyVoyageWithBooking(): array
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $type = TicketType::factory()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $booking = Booking::factory()->forTrip($trip)->create([
            'contact_email' => 'guest@example.com',
            'contact_name' => 'Guest One',
        ]);
        BookingTicket::factory()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $type->getKey(),
            'name' => 'Guest One',
            'email' => 'guest@example.com',
        ]);

        return [$user, $trip, $voyage, $booking];
    }

    public function test_cancel_then_uncancel_restores_voyage_and_attributed_bookings(): void
    {
        Notification::fake();

        [$user, $trip, $voyage, $booking] = $this->readyVoyageWithBooking();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'cancelled',
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $booking->refresh();
        $this->assertSame(VoyageStatus::Cancelled, $voyage->status);
        $this->assertSame(VoyageStatus::Ready->value, $voyage->cancelled_from_status);
        $this->assertSoftDeleted('bookings', ['id' => $booking->getKey()]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->getKey(),
            'cancelled_by_voyage_id' => $voyage->getKey(),
        ]);

        Notification::fake();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'ready',
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $booking->refresh();
        $this->assertSame(VoyageStatus::Ready, $voyage->status);
        $this->assertNull($voyage->cancelled_from_status);
        $this->assertFalse($booking->trashed());
        $this->assertNull($booking->cancelled_by_voyage_id);

        Notification::assertSentOnDemand(
            BookingReactivationNotification::class,
            function (BookingReactivationNotification $notification) use ($booking): bool {
                return $notification->booking->getKey() === $booking->getKey();
            },
        );
    }

    public function test_uncancel_leaves_user_cancelled_bookings_deleted(): void
    {
        Notification::fake();

        [$user, $trip, $voyage, $bookingA] = $this->readyVoyageWithBooking();
        $bookingB = Booking::factory()->forTrip($trip)->create([
            'contact_email' => 'other@example.com',
            'contact_name' => 'Guest Two',
        ]);
        $bookingB->delete();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'cancelled',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertSoftDeleted('bookings', ['id' => $bookingA->getKey()]);
        $this->assertSoftDeleted('bookings', ['id' => $bookingB->getKey()]);
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingA->getKey(),
            'cancelled_by_voyage_id' => $voyage->getKey(),
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingB->getKey(),
            'cancelled_by_voyage_id' => null,
        ]);

        Notification::fake();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'ready',
                    ],
                ],
            ],
        ])->assertOk();

        $bookingA->refresh();
        $bookingB->refresh();
        $this->assertFalse($bookingA->trashed());
        $this->assertTrue($bookingB->trashed());
        $this->assertNull($bookingB->cancelled_by_voyage_id);
    }

    public function test_uncancel_past_departure_is_rejected(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create([
            'scheduled_departure_at' => now()->subHour(),
        ]);
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Cancelled,
            'cancelled_from_status' => VoyageStatus::Ready->value,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'ready',
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Cancelled, $voyage->status);
        Notification::assertNothingSent();
    }
}
