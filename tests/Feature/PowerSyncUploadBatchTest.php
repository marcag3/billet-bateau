<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadBatchTest extends TestCase
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

    public function test_put_strips_created_at_from_inner_data(): void
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
                        'name' => 'With client timestamp key',
                        'theme_color' => '#000000',
                        'created_at' => '2026-01-01T00:00:00Z',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'name' => 'With client timestamp key',
        ]);
    }

    public function test_patch_strips_updated_at_from_inner_data(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'name' => 'Original',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'name' => 'Renamed',
                        'updated_at' => '2026-01-01T00:00:00Z',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $program->getKey(),
            'name' => 'Renamed',
        ]);
    }
}
