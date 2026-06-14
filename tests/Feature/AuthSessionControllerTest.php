<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthSessionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_when_accessing_app_shell(): void
    {
        $response = $this->get('/app');

        $response->assertRedirect('/app/login');
    }

    public function test_authenticated_user_can_access_app_shell(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/app');

        $response
            ->assertOk()
            ->assertSee('app-root', escape: false);
    }

    public function test_guest_cannot_fetch_the_authenticated_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }

    public function test_user_can_sign_in_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $loginResponse = $this->postJson('/login', [
            'email' => 'john@example.com',
            'password' => 'password',
            'remember' => true,
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);

        $profileResponse = $this->getJson('/api/auth/me');

        $profileResponse
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'john@example.com',
            'password' => 'invalid-password',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_logout_from_authenticated_session(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $this->postJson('/login', [
            'email' => 'john@example.com',
            'password' => 'password',
        ])->assertOk();

        $logoutResponse = $this->postJson('/logout');

        $logoutResponse->assertNoContent();

        Auth::forgetGuards();

        $this->getJson('/api/auth/me')->assertUnauthorized();
    }
}
