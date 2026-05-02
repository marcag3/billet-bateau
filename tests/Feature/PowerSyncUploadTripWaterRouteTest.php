<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Models\WaterRoute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadTripWaterRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_trip_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 12,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('trips', [
            'id' => $tripId,
            'program_id' => $program->getKey(),
            'boat_type_id' => $boatType->getKey(),
            'water_route_id' => $route->getKey(),
            'capacity' => 12,
        ]);
    }

    public function test_put_new_trip_without_capacity_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }

    public function test_put_trip_forbids_non_member_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $tripId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 8,
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }

    public function test_delete_removes_trip_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'trips',
                    'id' => $trip->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('trips', ['id' => $trip->getKey()]);
    }

    public function test_delete_trip_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $trip = Trip::factory()->forProgram($program)->create();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'trips',
                    'id' => $trip->getKey(),
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('trips', ['id' => $trip->getKey()]);
    }

    public function test_put_creates_water_route_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $routeId = (string) Str::ulid();
        $trace = '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.5540,45.5080]]}';

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'water_routes',
                    'id' => $routeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Canal loop',
                        'duration_minutes' => 90,
                        'trace' => $trace,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('water_routes', [
            'id' => $routeId,
            'program_id' => $program->getKey(),
            'name' => 'Canal loop',
            'duration_minutes' => 90,
        ]);
    }

    public function test_put_water_route_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $routeId = (string) Str::ulid();
        $trace = '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.5540,45.5080]]}';

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'water_routes',
                    'id' => $routeId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Intruder route',
                        'duration_minutes' => 60,
                        'trace' => $trace,
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('water_routes', ['id' => $routeId]);
    }

    public function test_patch_updates_water_route_name(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey(), 'name' => 'Old']);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'water_routes',
                    'id' => $route->getKey(),
                    'data' => [
                        'name' => 'Renamed',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('water_routes', [
            'id' => $route->getKey(),
            'name' => 'Renamed',
        ]);
    }

    public function test_delete_removes_water_route_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'water_routes',
                    'id' => $route->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('water_routes', ['id' => $route->getKey()]);
    }

    public function test_delete_water_route_unprocessable_when_voyage_references_it(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->forProgram($program)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        Voyage::factory()->forTrip($trip, $route)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'water_routes',
                    'id' => $route->getKey(),
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('water_routes', ['id' => $route->getKey()]);
    }

    public function test_put_trip_rejects_water_route_from_other_program(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->withOwner($user)->create();
        $programB = Program::factory()->withOwner($user)->create();
        $routeB = WaterRoute::factory()->create(['program_id' => $programB->getKey()]);
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $programA->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 10,
                        'water_route_id' => $routeB->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }

    public function test_put_trip_rejects_invalid_boat_type_ulid_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 10,
                        'boat_type_id' => 'not-a-ulid',
                        'water_route_id' => $route->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }
}
