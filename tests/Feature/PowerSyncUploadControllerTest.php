<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Program;
use App\Models\Todo;
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
                    'type' => 'todos',
                    'id' => (string) Str::uuid(),
                    'data' => ['title' => 'x', 'completed' => 0],
                ],
            ],
        ])->assertUnauthorized();
    }

    public function test_put_creates_todo_for_current_user(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'todos',
                    'id' => $id,
                    'data' => [
                        'title' => 'Write upload spec',
                        'completed' => 0,
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('todos', [
            'id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'title' => 'Write upload spec',
        ]);
    }

    public function test_patch_updates_existing_todo(): void
    {
        $user = User::factory()->create();
        $todo = Todo::factory()->for($user)->create(['title' => 'Old', 'completed' => false]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'todos',
                    'id' => $todo->id,
                    'data' => [
                        'title' => 'New',
                        'completed' => 1,
                    ],
                ],
            ],
        ])->assertOk();

        $todo->refresh();

        $this->assertSame('New', $todo->title);
        $this->assertTrue($todo->completed);
    }

    public function test_delete_removes_owned_todo(): void
    {
        $user = User::factory()->create();
        $todo = Todo::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'todos',
                    'id' => $todo->id,
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
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
                    'type' => 'todos',
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
                    'type' => 'todos',
                    'id' => 'not-a-uuid',
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_put_does_not_steal_other_users_todo(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $todo = Todo::factory()->for($owner)->create(['title' => 'Mine']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'todos',
                    'id' => $todo->id,
                    'data' => ['title' => 'Stolen', 'completed' => 0],
                ],
            ],
        ])->assertOk();

        $todo->refresh();
        $this->assertSame('Mine', $todo->title);
        $this->assertSame((int) $owner->getAuthIdentifier(), (int) $todo->user_id);
    }

    public function test_patch_does_not_update_other_users_todo(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $todo = Todo::factory()->for($owner)->create(['title' => 'Original']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'todos',
                    'id' => $todo->id,
                    'data' => ['title' => 'Hacked'],
                ],
            ],
        ])->assertOk();

        $todo->refresh();
        $this->assertSame('Original', $todo->title);
    }

    public function test_delete_does_not_remove_other_users_todo(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $todo = Todo::factory()->for($owner)->create();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'todos',
                    'id' => $todo->id,
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('todos', ['id' => $todo->id]);
    }

    public function test_put_does_not_overwrite_other_users_program(): void
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
        $this->assertSame('Owners', $program->name);
        $this->assertSame((int) $owner->getAuthIdentifier(), (int) $program->user_id);
    }

    public function test_delete_does_not_remove_other_users_program(): void
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

        $this->assertDatabaseHas('programs', ['id' => $program->getKey()]);
    }

    public function test_address_delete_by_other_user_does_not_remove_row_linked_to_foreign_program(): void
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

        $this->assertDatabaseHas('addresses', [
            'id' => $addressId,
            'line_1' => 'Owners pier',
        ]);
        $ownersProgram->refresh();
        $this->assertSame($addressId, $ownersProgram->address_id);
    }
}
