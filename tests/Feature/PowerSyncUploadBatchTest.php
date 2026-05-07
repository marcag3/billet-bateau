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

    public function test_put_ignores_client_created_at_in_inner_data(): void
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
                        'created_at' => '2000-01-01T00:00:00Z',
                    ],
                ],
            ],
        ])->assertOk();

        $program = Program::query()->whereKey($id)->first();
        $this->assertNotNull($program);
        $this->assertSame('With client timestamp key', $program->name);
        $this->assertNotSame(
            2000,
            (int) $program->created_at->format('Y'),
            'Client-supplied created_at must not be written to the database.',
        );
    }

    public function test_patch_ignores_client_updated_at_in_inner_data(): void
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
                        'updated_at' => '2000-01-01T00:00:00Z',
                    ],
                ],
            ],
        ])->assertOk();

        $program->refresh();
        $this->assertSame('Renamed', $program->name);
        $this->assertNotSame(
            2000,
            (int) $program->updated_at->format('Y'),
            'Client-supplied updated_at must not be written to the database.',
        );
    }

    public function test_boat_put_without_program_id_for_new_row_is_unprocessable(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => (string) Str::ulid(),
                    'data' => [
                        'name' => 'Solo',
                        'capacity' => 2,
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }
}
