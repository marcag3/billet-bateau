<?php

namespace Tests\Feature;

use App\Models\Boat;
use App\Models\BoatProgram;
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
        $program = Program::factory()->for($user)->create();
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
            'user_id' => $user->getAuthIdentifier(),
            'program_id' => $program->getKey(),
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

    public function test_put_forbids_non_member_from_overwriting_another_users_boat_type(): void
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
                    'data' => [
                        'program_id' => $boatType->program_id,
                        'name' => 'Hijacked',
                    ],
                ],
            ],
        ])->assertForbidden();

        $boatType->refresh();
        $this->assertSame('Owners', $boatType->name);
        $this->assertSame((int) $owner->getAuthIdentifier(), (int) $boatType->user_id);
    }

    public function test_delete_forbids_non_member_from_removing_another_users_boat(): void
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
        ])->assertForbidden();

        $this->assertDatabaseHas('boats', ['id' => $boat->getKey()]);
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
}
