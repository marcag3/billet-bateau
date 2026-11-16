<?php

namespace Tests\Feature;

use App\Models\Guide;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadGuideTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_guide(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $staffUser = User::factory()->create();
        $program->users()->attach($staffUser->getKey(), ['role' => 'admin']);
        $guideId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'guides',
                    'id' => $guideId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Marie Dupont',
                        'staff_user_id' => $staffUser->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('guides', [
            'id' => $guideId,
            'program_id' => $program->getKey(),
            'name' => 'Marie Dupont',
            'staff_user_id' => $staffUser->getKey(),
        ]);
    }

    public function test_patch_updates_guide_name(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $guide = Guide::factory()->create(['program_id' => $program->getKey(), 'name' => 'Original']);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'guides',
                    'id' => $guide->getKey(),
                    'data' => [
                        'name' => 'Renamed Guide',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('guides', [
            'id' => $guide->getKey(),
            'name' => 'Renamed Guide',
        ]);
    }

    public function test_delete_removes_guide(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $guide = Guide::factory()->create(['program_id' => $program->getKey()]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'guides',
                    'id' => $guide->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('guides', ['id' => $guide->getKey()]);
    }

    public function test_put_guide_forbids_non_member(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $guideId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'guides',
                    'id' => $guideId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Intruder Guide',
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('guides', ['id' => $guideId]);
    }

    public function test_put_guide_requires_program(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $guideId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                ['op' => 'PUT', 'type' => 'guides', 'id' => $guideId, 'data' => ['name' => 'No program']],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertSame(['Program is required.'], $response->json('results.0.errors')['data.program_id'] ?? null);
        $this->assertDatabaseMissing('guides', ['id' => $guideId]);
    }

    public function test_put_guide_rejects_staff_user_outside_program(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $outsider = User::factory()->create();
        $guideId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'guides',
                    'id' => $guideId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Linked outsider',
                        'staff_user_id' => $outsider->getKey(),
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('results.0.status', 'rejected');

        $this->assertSame(
            ['The staff member must belong to this program.'],
            $response->json('results.0.errors')['data.staff_user_id'] ?? null,
        );
        $this->assertDatabaseMissing('guides', ['id' => $guideId]);
    }

    public function test_patch_and_delete_reject_another_programs_guide(): void
    {
        $intruder = User::factory()->create();
        Program::factory()->withOwner($intruder)->create();
        $guide = Guide::factory()->create(['name' => 'Victim guide']);

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                ['op' => 'PATCH', 'type' => 'guides', 'id' => $guide->getKey(), 'data' => ['name' => 'Renamed']],
                ['op' => 'DELETE', 'type' => 'guides', 'id' => $guide->getKey()],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'rejected')
            ->assertJsonPath('results.1.status', 'rejected');

        $this->assertDatabaseHas('guides', ['id' => $guide->getKey(), 'name' => 'Victim guide']);
    }
}
