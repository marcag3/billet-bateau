<?php

namespace Tests\Feature;

use App\Models\Boat;
use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadBoatTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_boat_type_for_current_user(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $id = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_types',
                    'id' => $id,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'RIB',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boat_types', [
            'id' => $id,
            'program_id' => $program->getKey(),
            'name' => 'RIB',
        ]);
    }

    public function test_put_creates_boat_with_owned_boat_type(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);
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
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boats', [
            'id' => $boatId,
            'boat_type_id' => $boatType->getKey(),
            'program_id' => $program->getKey(),
            'name' => 'Sea Star',
            'capacity' => 12,
            'notes' => 'Morning runs',
        ]);
    }

    public function test_put_boat_resolves_another_users_boat_type_id(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($intruder)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);
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
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('boats', [
            'id' => $boatId,
            'boat_type_id' => $boatType->getKey(),
            'program_id' => $program->getKey(),
            'name' => 'Stolen link',
            'capacity' => 8,
        ]);
    }

    public function test_put_new_boat_without_capacity_is_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'No room',
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ]);

        $response->assertOk()->assertJsonPath('results.0.status', 'rejected');
        $errors = $response->json('results.0.errors') ?? [];
        $capacityErrors = $errors['capacity'] ?? $errors['data.capacity'] ?? null;
        $this->assertNotNull($capacityErrors);
        $this->assertNotEmpty($capacityErrors);

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }

    public function test_patch_updates_owned_boat_type(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey(), 'name' => 'Old']);

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
        $program = Program::factory()->withOwner($user)->create();
        $boat = Boat::factory()->create([
            'program_id' => $program->getKey(),
        ]);

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

    public function test_put_forbids_non_member_from_overwriting_another_users_boat_type(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey(), 'name' => 'Owners']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_types',
                    'id' => $boatType->getKey(),
                    'data' => [
                        'program_id' => $boatType->program_id,
                        'name' => 'Hijacked',
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $boatType->refresh();
        $this->assertSame('Owners', $boatType->name);
    }

    public function test_delete_forbids_non_member_from_removing_another_users_boat(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $boat = Boat::factory()->create([
            'program_id' => $program->getKey(),
        ]);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'boats',
                    'id' => $boat->getKey(),
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('boats', ['id' => $boat->getKey()]);
    }

    public function test_patch_boat_type_rejects_invalid_name_type_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);

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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');
    }

    public function test_patch_boat_rejects_negative_capacity_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boat = Boat::factory()->create([
            'program_id' => $program->getKey(),
        ]);

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
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');
    }

    public function test_put_boat_rejects_unknown_boat_type_id_returns_unprocessable(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
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
                        'program_id' => $program->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }
}
