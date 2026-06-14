<?php

namespace Tests\Feature;

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
