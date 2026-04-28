<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Boat;
use App\Models\BoatProgram;
use App\Models\BoatType;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Models\WaterRoute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_upload_powersync_batch(): void
    {
        $this->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => (string) Str::ulid(),
                    'data' => [
                        'name' => 'Guest probe',
                        'theme_color' => '#000000',
                    ],
                ],
            ],
        ])->assertUnauthorized();
    }

    public function test_put_creates_program_for_current_user(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $id,
                    'data' => [
                        'name' => 'Dockside',
                        'description' => 'Weekend runs',
                        'theme_color' => '#ff00aa',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'name' => 'Dockside',
            'theme_color' => '#FF00AA',
            'is_active' => 0,
            'is_archived' => 0,
            'slug' => 'dockside',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $id,
            'user_id' => $user->getAuthIdentifier(),
        ]);
    }

    public function test_put_derives_slug_from_accented_name_when_slug_missing(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $id,
                    'data' => [
                        'name' => 'Été Riviera',
                        'theme_color' => '#000000',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'slug' => 'ete-riviera',
        ]);
    }

    public function test_put_creates_address_when_parent_owned(): void
    {
        $user = User::factory()->create();
        $programId = (string) Str::ulid();
        $addressId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'addresses',
                    'id' => $addressId,
                    'data' => [
                        'line_1' => 'Pier 2',
                        'city' => 'Seaside',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $programId,
                    'data' => [
                        'name' => 'With address',
                        'theme_color' => '#111111',
                        'address_id' => $addressId,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $programId,
            'address_id' => $addressId,
            'slug' => 'with-address',
        ]);

        $this->assertDatabaseHas('addresses', [
            'id' => $addressId,
            'line_1' => 'Pier 2',
            'city' => 'Seaside',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $programId,
            'user_id' => $user->getAuthIdentifier(),
        ]);
    }

    public function test_delete_removes_owned_program(): void
    {
        $user = User::factory()->create();
        $addressId = (string) Str::ulid();
        Address::query()->create([
            'id' => $addressId,
            'line_1' => 'Old dock',
        ]);
        $program = Program::factory()->for($user)->create([
            'address_id' => $addressId,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('programs', ['id' => $program->getKey()]);
        $this->assertDatabaseMissing('addresses', ['id' => $addressId]);
    }

    public function test_invalid_op_returns_unprocessable_entity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'INVALID',
                    'type' => 'programs',
                    'id' => (string) Str::ulid(),
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_invalid_type_returns_unprocessable_entity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'unknown_table',
                    'id' => (string) Str::ulid(),
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_invalid_id_returns_unprocessable_entity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => 'not-a-ulid',
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_non_array_crud_returns_unprocessable_entity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => 'not-an-array',
        ])->assertUnprocessable();
    }

    public function test_put_forbids_non_member_from_overwriting_another_users_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->for($owner)->create(['name' => 'Owners']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'name' => 'Hijacked',
                        'theme_color' => '#ABCDEF',
                    ],
                ],
            ],
        ])->assertForbidden();

        $program->refresh();
        $this->assertSame('Owners', $program->name);
    }

    public function test_delete_forbids_non_member_from_removing_another_users_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->for($owner)->create();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('programs', ['id' => $program->getKey()]);
    }

    public function test_address_delete_by_authenticated_user_unlinks_foreign_program_and_removes_orphan(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $addressId = (string) Str::ulid();
        Address::query()->create([
            'id' => $addressId,
            'line_1' => 'Owners pier',
            'city' => 'Baytown',
        ]);
        $ownersProgram = Program::factory()->for($owner)->create([
            'address_id' => $addressId,
        ]);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'addresses',
                    'id' => $addressId,
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('addresses', ['id' => $addressId]);
        $ownersProgram->refresh();
        $this->assertNull($ownersProgram->address_id);
    }

    public function test_put_program_uses_suffix_when_slug_conflicts_globally(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        $id1 = (string) Str::ulid();
        $id2 = (string) Str::ulid();

        $this->actingAs($u1)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $id1,
                    'data' => [
                        'name' => 'First',
                        'theme_color' => '#000000',
                        'slug' => 'shared-slug',
                    ],
                ],
            ],
        ])->assertOk();

        $this->actingAs($u2)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $id2,
                    'data' => [
                        'name' => 'Second',
                        'theme_color' => '#000000',
                        'slug' => 'shared-slug',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $id1,
            'slug' => 'shared-slug',
        ]);
        $this->assertDatabaseHas('programs', [
            'id' => $id2,
            'slug' => 'shared-slug-2',
        ]);
    }

    public function test_put_creates_boat_type_for_current_user(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_types',
                    'id' => $id,
                    'data' => [
                        'name' => 'RIB',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boat_types', [
            'id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'name' => 'RIB',
        ]);
    }

    public function test_put_creates_boat_with_owned_boat_type(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();
        $boatId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'Sea Star',
                        'capacity' => 12,
                        'notes' => 'Morning runs',
                        'boat_type_id' => $boatType->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boats', [
            'id' => $boatId,
            'user_id' => $user->getAuthIdentifier(),
            'boat_type_id' => $boatType->getKey(),
            'name' => 'Sea Star',
            'capacity' => 12,
            'notes' => 'Morning runs',
        ]);
    }

    public function test_put_boat_resolves_another_users_boat_type_id(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $boatType = BoatType::factory()->for($owner)->create();
        $boatId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'Stolen link',
                        'capacity' => 8,
                        'boat_type_id' => $boatType->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boats', [
            'id' => $boatId,
            'user_id' => $intruder->getAuthIdentifier(),
            'boat_type_id' => $boatType->getKey(),
            'name' => 'Stolen link',
            'capacity' => 8,
        ]);
    }

    public function test_put_new_boat_without_capacity_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $boatId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'No room',
                    ],
                ],
            ],
        ]);

        $response->assertUnprocessable();
        $errors = $response->json('errors') ?? [];
        $this->assertArrayHasKey('data.capacity', $errors);
        $this->assertNotEmpty($errors['data.capacity']);

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }

    public function test_put_boat_program_rejects_unknown_boat_id(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $linkId = (string) Str::ulid();
        $unknownBoatId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_program',
                    'id' => $linkId,
                    'data' => [
                        'boat_id' => $unknownBoatId,
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('boat_program', ['id' => $linkId]);
    }

    public function test_patch_updates_owned_boat_type(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create(['name' => 'Old']);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'boat_types',
                    'id' => $boatType->getKey(),
                    'data' => ['name' => 'New label'],
                ],
            ],
        ])->assertOk();

        $boatType->refresh();
        $this->assertSame('New label', $boatType->name);
    }

    public function test_delete_removes_owned_boat(): void
    {
        $user = User::factory()->create();
        $boat = Boat::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'boats',
                    'id' => $boat->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('boats', ['id' => $boat->getKey()]);
    }

    public function test_put_allows_authenticated_user_to_overwrite_another_users_boat_type(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $boatType = BoatType::factory()->for($owner)->create(['name' => 'Owners']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_types',
                    'id' => $boatType->getKey(),
                    'data' => ['name' => 'Hijacked'],
                ],
            ],
        ])->assertOk();

        $boatType->refresh();
        $this->assertSame('Hijacked', $boatType->name);
        $this->assertSame((int) $intruder->getAuthIdentifier(), (int) $boatType->user_id);
    }

    public function test_delete_allows_authenticated_user_to_remove_another_users_boat(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $boat = Boat::factory()->for($owner)->create();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'boats',
                    'id' => $boat->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('boats', ['id' => $boat->getKey()]);
    }

    public function test_put_creates_boat_program_link(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $boat = Boat::factory()->for($user)->create();
        $linkId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_program',
                    'id' => $linkId,
                    'data' => [
                        'boat_id' => $boat->getKey(),
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boat_program', [
            'id' => $linkId,
            'boat_id' => $boat->getKey(),
            'program_id' => $program->getKey(),
        ]);
    }

    public function test_delete_removes_boat_program_link(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $boat = Boat::factory()->for($user)->create();
        $link = BoatProgram::query()->create([
            'id' => (string) Str::ulid(),
            'boat_id' => $boat->getKey(),
            'program_id' => $program->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'boat_program',
                    'id' => $link->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('boat_program', ['id' => $link->getKey()]);
    }

    public function test_put_creates_trip_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($owner)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($owner)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($owner)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $program = Program::factory()->for($user)->create();
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
        $programA = Program::factory()->for($user)->create();
        $programB = Program::factory()->for($user)->create();
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

    public function test_patch_boat_type_rejects_invalid_name_type_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'boat_types',
                    'id' => $boatType->getKey(),
                    'data' => [
                        'name' => ['invalid'],
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_patch_boat_rejects_negative_capacity_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $boat = Boat::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'boats',
                    'id' => $boat->getKey(),
                    'data' => [
                        'capacity' => -1,
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_put_trip_rejects_invalid_boat_type_ulid_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
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

    public function test_put_program_rejects_invalid_theme_color_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $programId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $programId,
                    'data' => [
                        'name' => 'Bad color',
                        'theme_color' => 'red',
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('programs', ['id' => $programId]);
    }

    public function test_patch_program_rejects_invalid_theme_color_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'theme_color' => '#GGGGGG',
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_put_boat_rejects_unknown_boat_type_id_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $boatId = (string) Str::ulid();
        $missingBoatTypeId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'Ghost type',
                        'capacity' => 4,
                        'boat_type_id' => $missingBoatTypeId,
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }

    public function test_put_creates_template_day_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $templateDayId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_days',
                    'id' => $templateDayId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Standard Saturday',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_days', [
            'id' => $templateDayId,
            'program_id' => $program->getKey(),
            'name' => 'Standard Saturday',
        ]);
    }

    public function test_put_template_day_forbids_non_member_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->for($owner)->create();
        $templateDayId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_days',
                    'id' => $templateDayId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Blocked',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('template_days', ['id' => $templateDayId]);
    }

    public function test_put_creates_template_day_slot(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        $slotId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_day_slots',
                    'id' => $slotId,
                    'data' => [
                        'template_day_id' => $templateDay->getKey(),
                        'sort_order' => 1,
                        'departure_time' => '10:15:00',
                        'capacity' => 20,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_day_slots', [
            'id' => $slotId,
            'template_day_id' => $templateDay->getKey(),
            'departure_time' => '10:15:00',
            'capacity' => 20,
        ]);
    }

    public function test_put_creates_template_day_date(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $rowId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_day_dates',
                    'id' => $rowId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'template_day_id' => $templateDay->getKey(),
                        'service_date' => '2026-07-04',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_day_dates', [
            'id' => $rowId,
            'program_id' => $program->getKey(),
            'template_day_id' => $templateDay->getKey(),
        ]);
    }

    public function test_put_trip_accepts_template_day_slot_in_same_program(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $slot = TemplateDaySlot::factory()->forTemplateDay($templateDay)->create();
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
                        'template_day_slot_id' => $slot->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('trips', [
            'id' => $tripId,
            'template_day_slot_id' => $slot->getKey(),
        ]);
    }

    public function test_put_trip_rejects_template_day_slot_from_other_program(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->for($user)->create();
        $programB = Program::factory()->for($user)->create();
        $slotB = TemplateDaySlot::factory()
            ->forTemplateDay(TemplateDay::factory()->forProgram($programB)->create())
            ->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $programA->getKey()]);
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
                        'capacity' => 12,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                        'template_day_slot_id' => $slotB->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }

    public function test_delete_template_day_slot_nulls_linked_trip_reference(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $slot = TemplateDaySlot::factory()->forTemplateDay($templateDay)->create();
        $trip = Trip::factory()->forProgram($program)->create([
            'template_day_slot_id' => $slot->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'template_day_slots',
                    'id' => $slot->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('template_day_slots', ['id' => $slot->getKey()]);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->getKey(),
            'template_day_slot_id' => null,
        ]);
    }
}
