<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadCheckInTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_check_in_for_booking_and_voyage(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkInId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $checkInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                        'notes' => 'Front desk',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('check_ins', [
            'id' => $checkInId,
            'booking_id' => $booking->getKey(),
            'voyage_id' => $voyage->getKey(),
            'notes' => 'Front desk',
        ]);
    }

    public function test_patch_updates_check_in_notes(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkIn = CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create([
            'notes' => 'Original',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'check_ins',
                    'id' => $checkIn->getKey(),
                    'data' => [
                        'notes' => 'Updated note',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('check_ins', [
            'id' => $checkIn->getKey(),
            'notes' => 'Updated note',
        ]);
    }

    public function test_delete_removes_check_in(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkIn = CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'check_ins',
                    'id' => $checkIn->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('check_ins', ['id' => $checkIn->getKey()]);
    }

    public function test_put_check_in_rejects_wrong_trip(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $tripA = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $tripB = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($tripA)->create();
        $voyage = Voyage::factory()->forTrip($tripB)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkInId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $checkInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('check_ins', ['id' => $checkInId]);
    }

    public function test_put_check_in_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkInId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $checkInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('check_ins', ['id' => $checkInId]);
    }

    public function test_put_check_in_rejects_completed_voyage(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Completed,
            'arrived_at' => now(),
        ]);
        $checkInId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $checkInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('check_ins', ['id' => $checkInId]);
    }

    public function test_put_check_in_rejects_duplicate_booking(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create();
        $secondCheckInId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $secondCheckInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('check_ins', ['id' => $secondCheckInId]);
    }

    public function test_put_check_in_then_passenger_with_check_in_id(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $checkInId = (string) Str::ulid();
        $passengerId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'check_ins',
                    'id' => $checkInId,
                    'data' => [
                        'booking_id' => $booking->getKey(),
                        'voyage_id' => $voyage->getKey(),
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'passengers',
                    'id' => $passengerId,
                    'data' => [
                        'voyage_id' => $voyage->getKey(),
                        'name' => 'Guest One',
                        'booking_id' => $booking->getKey(),
                        'check_in_id' => $checkInId,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('passengers', [
            'id' => $passengerId,
            'check_in_id' => $checkInId,
            'booking_id' => $booking->getKey(),
        ]);
    }

    public function test_delete_check_in_rejects_completed_voyage(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $booking = Booking::factory()->forTrip($trip)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Completed,
            'arrived_at' => now(),
        ]);
        $checkIn = CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'check_ins',
                    'id' => $checkIn->getKey(),
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('check_ins', ['id' => $checkIn->getKey()]);
    }
}
