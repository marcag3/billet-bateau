<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Boat;
use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
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
                    'id' => (string) Str::uuid(),
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
        $id = (string) Str::uuid();

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
            'slug' => 'dockside',
        ]);
    }

    public function test_put_creates_address_when_parent_owned(): void
    {
        $user = User::factory()->create();
        $programId = (string) Str::uuid();
        $addressId = (string) Str::uuid();

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
    }

    public function test_delete_removes_owned_program(): void
    {
        $user = User::factory()->create();
        $addressId = (string) Str::uuid();
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
                    'id' => (string) Str::uuid(),
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
                    'id' => (string) Str::uuid(),
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
                    'id' => 'not-a-uuid',
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

    public function test_put_allows_authenticated_user_to_overwrite_another_users_program(): void
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
        ])->assertOk();

        $program->refresh();
        $this->assertSame('Hijacked', $program->name);
        $this->assertSame((int) $intruder->getAuthIdentifier(), (int) $program->user_id);
        $this->assertSame('#ABCDEF', $program->theme_color);
    }

    public function test_delete_allows_authenticated_user_to_remove_another_users_program(): void
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
        ])->assertOk();

        $this->assertDatabaseMissing('programs', ['id' => $program->getKey()]);
    }

    public function test_address_delete_by_authenticated_user_unlinks_foreign_program_and_removes_orphan(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $addressId = (string) Str::uuid();
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
        $id1 = (string) Str::uuid();
        $id2 = (string) Str::uuid();

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
        $id = (string) Str::uuid();

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
        $boatId = (string) Str::uuid();

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
        $boatId = (string) Str::uuid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $boatId,
                    'data' => [
                        'name' => 'Stolen link',
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
        ]);
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
}
