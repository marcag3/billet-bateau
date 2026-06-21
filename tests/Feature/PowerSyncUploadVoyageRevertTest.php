<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PowerSyncUploadVoyageRevertTest extends TestCase
{
    use RefreshDatabase;

    public function test_patch_underway_voyage_to_ready_reverts_departure(): void
    {
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
                        'status' => 'ready',
                        'started_at' => null,
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Ready, $voyage->status);
        $this->assertNull($voyage->started_at);
    }

    public function test_patch_completed_voyage_to_underway_reverts_arrival(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $startedAt = now()->subHours(2);
        $arrivedAt = now()->subHour();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Completed,
            'started_at' => $startedAt,
            'arrived_at' => $arrivedAt,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'underway',
                        'arrived_at' => null,
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Underway, $voyage->status);
        $this->assertNull($voyage->arrived_at);
        $this->assertNotNull($voyage->started_at);
    }

    public function test_patch_ready_voyage_to_ready_is_not_a_revert(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
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
                        'status' => 'ready',
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Ready, $voyage->status);
    }

    public function test_patch_underway_voyage_to_draft_is_rejected(): void
    {
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
                        'status' => 'draft',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Underway, $voyage->status);
    }

    public function test_patch_completed_voyage_with_non_revert_fields_is_rejected(): void
    {
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
                        'trip_id' => $trip->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }
}
