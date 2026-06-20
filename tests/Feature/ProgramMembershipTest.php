<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramMembershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_owner_cannot_list_membership(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($admin)
            ->getJson("/api/programs/{$program->id}/membership")
            ->assertForbidden();
    }

    public function test_owner_can_list_members_and_pending_invitations(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'pending@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', str_repeat('a', 64)),
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($owner)
            ->getJson("/api/programs/{$program->id}/membership")
            ->assertOk()
            ->assertJsonCount(2, 'data.members')
            ->assertJsonCount(1, 'data.pending_invitations')
            ->assertJsonPath('data.pending_invitations.0.email', 'pending@example.com');
    }

    public function test_owner_can_remove_admin(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($owner)
            ->deleteJson("/api/programs/{$program->id}/members/{$admin->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('program_user', [
            'program_id' => $program->id,
            'user_id' => $admin->id,
        ]);
    }

    public function test_non_owner_cannot_remove_member(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $otherAdmin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);
        $program->users()->attach((string) $otherAdmin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($admin)
            ->deleteJson("/api/programs/{$program->id}/members/{$otherAdmin->id}")
            ->assertForbidden();
    }

    public function test_cannot_remove_owner(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $this->actingAs($owner)
            ->deleteJson("/api/programs/{$program->id}/members/{$owner->id}")
            ->assertForbidden();
    }

    public function test_cannot_remove_self(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($owner)
            ->deleteJson("/api/programs/{$program->id}/members/{$owner->id}")
            ->assertForbidden();
    }

    public function test_owner_can_revoke_pending_invitation(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $invitation = ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'revoke@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', str_repeat('b', 64)),
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($owner)
            ->deleteJson("/api/programs/{$program->id}/invitations/{$invitation->id}")
            ->assertNoContent();

        $invitation->refresh();
        $this->assertNotNull($invitation->revoked_at);
    }

    public function test_cannot_revoke_accepted_invitation(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $invitation = ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'accepted@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', str_repeat('c', 64)),
            'expires_at' => now()->addDay(),
            'accepted_at' => now(),
        ]);

        $this->actingAs($owner)
            ->deleteJson("/api/programs/{$program->id}/invitations/{$invitation->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['invitation']);
    }

    public function test_owner_can_transfer_ownership_to_admin(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($owner)
            ->postJson("/api/programs/{$program->id}/transfer-ownership", [
                'user_id' => $admin->id,
            ])
            ->assertNoContent();

        $this->assertDatabaseHas('program_user', [
            'program_id' => $program->id,
            'user_id' => $admin->id,
            'role' => 'owner',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $program->id,
            'user_id' => $owner->id,
            'role' => 'admin',
        ]);
    }

    public function test_cannot_transfer_ownership_to_self(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $this->actingAs($owner)
            ->postJson("/api/programs/{$program->id}/transfer-ownership", [
                'user_id' => $owner->id,
            ])
            ->assertForbidden();
    }

    public function test_cannot_transfer_ownership_to_non_member(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        $this->actingAs($owner)
            ->postJson("/api/programs/{$program->id}/transfer-ownership", [
                'user_id' => $outsider->id,
            ])
            ->assertForbidden();
    }

    public function test_non_owner_cannot_transfer_ownership(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $otherAdmin = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $program->users()->attach((string) $admin->getAuthIdentifier(), ['role' => 'admin']);
        $program->users()->attach((string) $otherAdmin->getAuthIdentifier(), ['role' => 'admin']);

        $this->actingAs($admin)
            ->postJson("/api/programs/{$program->id}/transfer-ownership", [
                'user_id' => $otherAdmin->id,
            ])
            ->assertForbidden();
    }
}
