<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use App\Notifications\ProgramInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProgramInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_owner_cannot_create_invitation(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($admin)
            ->postJson("/api/programs/{$program->id}/invitations", [
                'email' => 'new-admin@example.com',
            ])
            ->assertForbidden();

        Notification::assertNothingSent();
    }

    public function test_owner_can_create_invitation_and_notification_is_sent(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $this->actingAs($owner)
            ->postJson("/api/programs/{$program->id}/invitations", [
                'email' => 'New-Admin@example.com',
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'new-admin@example.com');

        $this->assertDatabaseHas('program_invitations', [
            'program_id' => $program->id,
            'email' => 'new-admin@example.com',
            'role' => 'admin',
        ]);

        Notification::assertSentOnDemand(ProgramInvitationNotification::class, function (ProgramInvitationNotification $notification): bool {
            return strlen($notification->plainToken) === 64;
        });
    }

    public function test_cannot_invite_existing_program_member(): void
    {
        Notification::fake();

        $owner = User::factory()->create();
        $member = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $member->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($owner)
            ->postJson("/api/programs/{$program->id}/invitations", [
                'email' => $member->email,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        Notification::assertNothingSent();
    }

    public function test_invite_preview_endpoint_returns_payload_for_valid_token(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('a', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'preview@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->getJson("/invite/{$plain}")
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('data.email', 'preview@example.com')
            ->assertJsonPath('data.program_name', $program->name);
    }

    public function test_guest_can_accept_invitation_and_becomes_program_admin(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('b', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'joiner@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/invite/{$plain}/accept", [
            'name' => 'Joiner User',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'joiner@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'joiner@example.com',
            'name' => 'Joiner User',
        ]);

        $joiner = User::query()->where('email', 'joiner@example.com')->firstOrFail();

        $this->assertDatabaseHas('program_user', [
            'program_id' => $program->id,
            'user_id' => $joiner->id,
            'role' => 'admin',
        ]);

        $this->assertDatabaseHas('program_invitations', [
            'program_id' => $program->id,
            'email' => 'joiner@example.com',
        ]);

        $invite = ProgramInvitation::query()->where('email', 'joiner@example.com')->firstOrFail();
        $this->assertNotNull($invite->accepted_at);
    }

    public function test_logged_in_user_with_wrong_email_cannot_accept(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('c', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'target@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($intruder)
            ->postJson("/invite/{$plain}/accept", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_logged_in_user_with_matching_email_can_accept(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create([
            'email' => 'match@example.com',
        ]);
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('d', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'match@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($joiner)
            ->postJson("/invite/{$plain}/accept", [])
            ->assertOk();

        $this->assertDatabaseHas('program_user', [
            'program_id' => $program->id,
            'user_id' => $joiner->id,
            'role' => 'admin',
        ]);
    }

    public function test_guest_cannot_accept_when_account_already_exists(): void
    {
        User::factory()->create([
            'email' => 'exists@example.com',
        ]);

        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('e', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'exists@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/invite/{$plain}/accept", [
            'name' => 'Nope',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_expired_invitation_cannot_be_accepted(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('f', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'late@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->subMinute(),
        ]);

        $this->postJson("/invite/{$plain}/accept", [
            'name' => 'Late',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_accepted_invitation_cannot_be_reused(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $plain = str_repeat('g', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'reuse@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
            'accepted_at' => now(),
        ]);

        $this->postJson("/invite/{$plain}/accept", [
            'name' => 'Reuse',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }
}
