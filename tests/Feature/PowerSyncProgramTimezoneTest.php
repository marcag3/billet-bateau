<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PowerSyncProgramTimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_patch_updates_program_timezone(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'timezone' => 'America/Toronto',
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'timezone' => 'America/Toronto',
                    ],
                ],
            ],
        ])->assertOk();

        $program->refresh();
        $this->assertSame('America/Toronto', $program->timezone);
    }

    public function test_patch_rejects_invalid_timezone(): void
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
                        'timezone' => 'Not/A_Real_Zone',
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }
}
