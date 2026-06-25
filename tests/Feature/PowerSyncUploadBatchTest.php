<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\AssertsPowerSyncUploadRejected;
use Tests\TestCase;

class PowerSyncUploadBatchTest extends TestCase
{
    use AssertsPowerSyncUploadRejected;
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

    public function test_invalid_op_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'INVALID',
                    'type' => 'programs',
                    'id' => (string) Str::ulid(),
                ],
            ],
        ]);

        $this->assertPowerSyncUploadRejected($response);
    }

    public function test_invalid_type_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'unknown_table',
                    'id' => (string) Str::ulid(),
                ],
            ],
        ]);

        $this->assertPowerSyncUploadRejected($response);
    }

    public function test_invalid_id_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => 'not-a-ulid',
                ],
            ],
        ]);

        $this->assertPowerSyncUploadRejected($response);
    }

    public function test_non_array_crud_returns_empty_results(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => 'not-an-array',
        ])
            ->assertOk()
            ->assertJsonPath('results', []);
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
        ])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'applied');

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
        ])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'applied');

        $program->refresh();
        $this->assertSame('Renamed', $program->name);
        $this->assertNotSame(
            2000,
            (int) $program->updated_at->format('Y'),
            'Client-supplied updated_at must not be written to the database.',
        );
    }

    public function test_boat_put_without_program_id_for_new_row_is_rejected(): void
    {
        $user = User::factory()->create();
        Program::factory()->withOwner($user)->create();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
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
        ]);

        $this->assertPowerSyncUploadRejected($response);
    }

    public function test_mixed_batch_applies_valid_entry_and_rejects_invalid_entry(): void
    {
        $user = User::factory()->create();
        $programId = (string) Program::factory()->withOwner($user)->create()->getKey();
        $validProgramId = (string) Str::ulid();
        $invalidBoatId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'programs',
                    'id' => $validProgramId,
                    'data' => [
                        'name' => 'Valid program',
                        'theme_color' => '#000000',
                    ],
                ],
                [
                    'op' => 'PUT',
                    'type' => 'boats',
                    'id' => $invalidBoatId,
                    'data' => [
                        'name' => 'Missing program',
                        'capacity' => 2,
                    ],
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('results.0.status', 'applied')
            ->assertJsonPath('results.1.status', 'rejected');

        $this->assertDatabaseHas('programs', [
            'id' => $validProgramId,
            'name' => 'Valid program',
        ]);
        $this->assertDatabaseMissing('boats', ['id' => $invalidBoatId]);
        $this->assertNotSame($programId, $validProgramId);
    }

    public function test_put_voyage_guide_with_invalid_guide_id_is_rejected(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $trip = Trip::factory()->withWaterRoute()->forProgram($program)->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);
        $pivotId = (string) Str::ulid();

        $response = $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'voyage_guide',
                    'id' => $pivotId,
                    'data' => [
                        'voyage_id' => $voyage->getKey(),
                        'guide_id' => (string) Str::ulid(),
                    ],
                ],
            ],
        ]);

        $this->assertPowerSyncUploadRejected($response)
            ->assertJsonPath('results.0.errors.guide_id.0', __('validation.exists', ['attribute' => 'guide id']));

        $this->assertDatabaseMissing('voyage_guide', ['id' => $pivotId]);
    }

    public function test_unauthorized_program_write_is_rejected(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $response = $this->actingAs($otherUser)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'name' => 'Hijacked',
                    ],
                ],
            ],
        ]);

        $this->assertPowerSyncUploadRejected($response)
            ->assertJsonPath('results.0.errors.authorization.0', __('This action is unauthorized.'));
    }
}
