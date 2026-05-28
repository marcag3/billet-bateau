<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Boat;
use App\Models\Guide;
use App\Models\Passenger;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadVoyagePassengerTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_voyage_and_start_departure_with_boats(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $boat = Boat::factory()->create(['program_id' => $program->getKey()]);
        $voyageId = (string) Str::ulid();
        $voyageBoatId = (string) Str::ulid();
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
                        'status' => 'ready',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'voyage_boat',
                    'id' => $voyageBoatId,
                    'data' => [
                        'voyage_id' => $voyageId,
                        'boat_id' => $boat->getKey(),
                    ],
                ],
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyageId,
                    'data' => [
                        'status' => 'underway',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('voyages', [
            'id' => $voyageId,
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'status' => VoyageStatus::Underway->value,
        ]);

        $voyage = Voyage::query()->whereKey($voyageId)->first();
        $this->assertNotNull($voyage?->started_at);
    }

    public function test_patch_voyage_mark_arrived(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $boat = Boat::factory()->create(['program_id' => $program->getKey()]);
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Underway,
            'started_at' => now(),
        ]);
        DB::table('voyage_boat')->insert([
            'id' => (string) Str::ulid(),
            'voyage_id' => $voyage->getKey(),
            'boat_id' => $boat->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'voyages',
                    'id' => $voyage->getKey(),
                    'data' => [
                        'status' => 'completed',
                    ],
                ],
            ],
        ])->assertOk();

        $voyage->refresh();
        $this->assertSame(VoyageStatus::Completed, $voyage->status);
        $this->assertNotNull($voyage->arrived_at);
    }

    public function test_put_passenger_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $passengerId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'passengers',
                    'id' => $passengerId,
                    'data' => [
                        'voyage_id' => $voyage->getKey(),
                        'name' => 'Walk-on Guest',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('passengers', [
            'id' => $passengerId,
            'voyage_id' => $voyage->getKey(),
            'name' => 'Walk-on Guest',
        ]);
    }

    public function test_put_voyage_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyageId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'voyages',
                    'id' => $voyageId,
                    'data' => [
                        'trip_id' => $trip->getKey(),
                        'water_route_id' => $trip->product->water_route_id,
                        'status' => 'ready',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('voyages', ['id' => $voyageId]);
    }

    public function test_put_voyage_guide_assignment(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $guide = Guide::factory()->create();
        $pivotId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'voyage_guide',
                    'id' => $pivotId,
                    'data' => [
                        'voyage_id' => $voyage->getKey(),
                        'guide_id' => $guide->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('voyage_guide', [
            'id' => $pivotId,
            'voyage_id' => $voyage->getKey(),
            'guide_id' => $guide->getKey(),
        ]);
    }

    public function test_delete_passenger(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $passenger = Passenger::factory()->forVoyage($voyage)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'passengers',
                    'id' => $passenger->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('passengers', ['id' => $passenger->getKey()]);
    }
}
