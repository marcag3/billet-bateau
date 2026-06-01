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
        Program::factory()->withOwner($user)->create();
        $staffUser = User::factory()->create();
        $guideId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'guides',
                    'id' => $guideId,
                    'data' => [
                        'name' => 'Marie Dupont',
                        'staff_user_id' => $staffUser->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('guides', [
            'id' => $guideId,
            'name' => 'Marie Dupont',
            'staff_user_id' => $staffUser->getKey(),
        ]);
    }

    public function test_patch_updates_guide_name(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();
        $guide = Guide::factory()->create(['name' => 'Original']);

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
        Program::factory()->withOwner($user)->create();
        $guide = Guide::factory()->create();

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
        Program::factory()->withOwner($owner)->create();
        $guideId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'guides',
                    'id' => $guideId,
                    'data' => [
                        'name' => 'Intruder Guide',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('guides', ['id' => $guideId]);
    }
}
