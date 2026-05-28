<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class BookingPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_may_create_public_booking_for_active_in_season_program(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        $this->assertTrue(
            Gate::check('createPublic', [Booking::class, $program]),
        );
    }

    public function test_guest_may_not_create_public_booking_for_inactive_program(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => false,
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        $this->assertFalse(
            Gate::check('createPublic', [Booking::class, $program]),
        );
    }

    public function test_guest_may_not_create_public_booking_for_past_season_program(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $this->assertFalse(
            Gate::check('createPublic', [Booking::class, $program]),
        );
    }
}
