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
use App\Notifications\BookingCancellationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadVoyageCancelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Trip, 2: Booking}
     */
    private function tripWithBooking(): array
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $type = TicketType::factory()->forProgram($program)->create();
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

        return [$user, $trip, $booking];
    }

    public function test_patch_ready_voyage_to_cancelled_deletes_bookings_and_notifies_guests(): void
    {
        Notification::fake();

        [$user, $trip, $booking] = $this->tripWithBooking();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);

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
        $this->assertSame(VoyageStatus::Cancelled, $voyage->status);
        $this->assertDatabaseMissing('bookings', ['id' => $booking->getKey()]);

        Notification::assertSentOnDemand(
            BookingCancellationNotification::class,
            function (BookingCancellationNotification $notification) use ($booking): bool {
                return $notification->booking->getKey() === $booking->getKey();
            },
        );
    }

    public function test_put_new_voyage_with_cancelled_status_cleans_up_trip_bookings(): void
    {
        Notification::fake();

        [$user, $trip, $booking] = $this->tripWithBooking();
        $voyageId = (string) Str::ulid();
        $waterRouteId = (string) $trip->product->water_route_id;

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'voyages',
                    'id' => $voyageId,
                    'data' => [
                        'trip_id' => $trip->getKey(),
                        'water_route_id' => $waterRouteId,
                        'status' => 'cancelled',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('voyages', [
            'id' => $voyageId,
            'trip_id' => $trip->getKey(),
            'status' => VoyageStatus::Cancelled->value,
        ]);
        $this->assertDatabaseMissing('bookings', ['id' => $booking->getKey()]);

        Notification::assertSentOnDemand(BookingCancellationNotification::class);
    }

    public function test_patch_underway_voyage_to_cancelled_is_rejected(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Underway,
            'started_at' => now(),
        ]);

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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Underway, $voyage->status);
        Notification::assertNothingSent();
    }

    public function test_patch_completed_voyage_is_rejected(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Completed,
            'started_at' => now()->subHour(),
            'arrived_at' => now(),
        ]);

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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        Notification::assertNothingSent();
    }

    public function test_patch_already_cancelled_voyage_is_idempotent(): void
    {
        Notification::fake();

        [$user, $trip, $booking] = $this->tripWithBooking();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Cancelled,
        ]);

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

        $this->assertDatabaseHas('bookings', ['id' => $booking->getKey()]);
        Notification::assertNothingSent();
    }
}
