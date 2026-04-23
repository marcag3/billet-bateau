<?php

namespace Tests\Feature;

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
}
