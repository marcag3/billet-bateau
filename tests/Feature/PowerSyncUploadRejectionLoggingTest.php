<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadRejectionLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_rejection_logs_full_entry_payload(): void
    {
        $logSpy = Log::spy();
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $entry = [
            'op' => 'PUT',
            'type' => 'boats',
            'id' => (string) Str::ulid(),
            'data' => [
                'name' => 'No room',
                'program_id' => $program->getKey(),
            ],
        ];

        $this->actingAs($user)->postJson('/api/powersync/upload', ['crud' => [$entry]])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'rejected');

        $logSpy->shouldHaveReceived('warning')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'PowerSync upload entry rejected.'
                && $context['user_id'] === (string) $user->getKey()
                && $context['entry'] === $entry
                && $context['errors'] !== []);
    }

    public function test_authorization_rejection_logs_full_entry_payload(): void
    {
        $logSpy = Log::spy();
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);
        $entry = [
            'op' => 'PUT',
            'type' => 'boat_types',
            'id' => $boatType->getKey(),
            'data' => [
                'program_id' => $boatType->program_id,
                'name' => 'Hijacked',
            ],
        ];

        $this->actingAs($intruder)->postJson('/api/powersync/upload', ['crud' => [$entry]])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'rejected');

        $logSpy->shouldHaveReceived('warning')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'PowerSync upload entry rejected.'
                && $context['user_id'] === (string) $intruder->getKey()
                && $context['entry'] === $entry
                && array_key_exists('authorization', $context['errors']));
    }

    public function test_malformed_entry_and_unknown_op_are_logged(): void
    {
        $logSpy = Log::spy();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                'not-an-object',
                ['op' => 'BOGUS', 'type' => 'boats', 'id' => (string) Str::ulid()],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'rejected')
            ->assertJsonPath('results.1.status', 'rejected');

        $logSpy->shouldHaveReceived('warning')
            ->twice()
            ->withArgs(fn (string $message): bool => $message === 'PowerSync upload entry rejected.');
    }

    public function test_applied_entry_is_not_logged(): void
    {
        $logSpy = Log::spy();
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'boat_types',
                    'id' => (string) Str::ulid(),
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'RIB',
                    ],
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('results.0.status', 'applied');

        $logSpy->shouldNotHaveReceived('warning');
    }
}
