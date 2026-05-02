<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadProgramTest extends TestCase
{
    use RefreshDatabase;

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
            'name' => 'Dockside',
            'theme_color' => '#FF00AA',
            'is_active' => 0,
            'is_archived' => 0,
            'slug' => 'dockside',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'role' => 'admin',
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

    public function test_put_sets_inline_address_on_program_when_parent_owned(): void
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
                        'name' => 'With address',
                        'theme_color' => '#111111',
                        'line_1' => 'Pier 2',
                        'city' => 'Seaside',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('programs', [
            'id' => $programId,
            'line_1' => 'Pier 2',
            'city' => 'Seaside',
            'slug' => 'with-address',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $programId,
            'user_id' => $user->getAuthIdentifier(),
            'role' => 'admin',
        ]);
    }

    public function test_delete_removes_owned_program(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'line_1' => 'Old dock',
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
    }

    public function test_put_forbids_non_member_from_overwriting_another_users_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create(['name' => 'Owners']);

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
        $program = Program::factory()->withOwner($owner)->create();

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
        $program = Program::factory()->withOwner($user)->create();

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
}
