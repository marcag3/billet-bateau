<?php

namespace Tests\Unit;

use App\Models\Program;
use App\Models\User;
use App\Support\ProgramTimezone;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramTimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolve_uses_program_timezone_when_valid(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'timezone' => 'America/Vancouver',
        ]);

        $this->assertSame('America/Vancouver', ProgramTimezone::resolve($program));
    }

    public function test_resolve_falls_back_to_default_when_program_timezone_missing(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'timezone' => '',
        ]);

        $this->assertSame(ProgramTimezone::DEFAULT, ProgramTimezone::resolve($program));
        $this->assertSame(ProgramTimezone::DEFAULT, ProgramTimezone::resolve(null));
    }

    public function test_format_departure_uses_program_timezone(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create([
            'timezone' => 'America/Toronto',
        ]);

        $departure = CarbonImmutable::parse('2026-06-15T18:00:00Z');

        $label = ProgramTimezone::formatDeparture($departure, 'en', $program);

        $this->assertStringContainsString('2:00 PM', $label);
        $this->assertStringNotContainsString('6:00 PM', $label);
    }
}
