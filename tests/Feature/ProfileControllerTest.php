<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/auth/profile', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_update_password(): void
    {
        $response = $this->putJson('/api/auth/password', [
            'current_password' => 'password',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ]);

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->getAuthIdentifier())
            ->assertJsonPath('user.name', 'Jane Doe')
            ->assertJsonPath('user.email', 'jane@example.com');

        $user->refresh();

        $this->assertSame('Jane Doe', $user->name);
        $this->assertSame('jane@example.com', $user->email);
    }

    public function test_profile_update_rejects_email_with_pending_program_invitation(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();

        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'invited@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', str_repeat('a', 64)),
            'expires_at' => now()->addDay(),
        ]);

        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $this->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => $user->name,
                'email' => 'invited@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $user->refresh();
        $this->assertSame('john@example.com', $user->email);
    }

    public function test_profile_update_blocks_invitation_hijack_via_email_change(): void
    {
        $owner = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $intruder = User::factory()->create([
            'email' => 'intruder@example.com',
        ]);

        $plain = str_repeat('f', 64);
        ProgramInvitation::query()->create([
            'program_id' => $program->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'newadmin@example.com',
            'role' => 'admin',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->actingAs($intruder)
            ->putJson('/api/auth/profile', [
                'name' => $intruder->name,
                'email' => 'newadmin@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->actingAs($intruder)
            ->postJson("/invite/{$plain}/accept", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_profile_update_enforces_unique_email(): void
    {
        User::factory()->create([
            'email' => 'taken@example.com',
        ]);

        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => $user->name,
                'email' => 'taken@example.com',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->putJson('/api/auth/password', [
                'current_password' => 'password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Your password has been changed.');

        $user->refresh();

        $this->assertTrue(Hash::check('new-secure-password', (string) $user->password));
    }

    public function test_password_change_rejects_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->putJson('/api/auth/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_password_change_rejects_mismatched_confirmation(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->putJson('/api/auth/password', [
                'current_password' => 'password',
                'password' => 'new-secure-password',
                'password_confirmation' => 'different-password',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }
}
