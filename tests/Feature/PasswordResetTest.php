<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_load_forgot_password_spa_shell(): void
    {
        User::factory()->create();

        $response = $this->get('/app/forgot-password');

        $response
            ->assertOk()
            ->assertSee('app-root', escape: false);
    }

    public function test_send_link_for_existing_user_sends_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this->postJson('/forgot-password', [
            'email' => 'john@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email, we sent a password reset link.',
            );

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_send_link_for_unknown_email_returns_generic_success(): void
    {
        Notification::fake();

        User::factory()->create();

        $response = $this->postJson('/forgot-password', [
            'email' => 'unknown@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email, we sent a password reset link.',
            );

        Notification::assertNothingSent();
    }

    public function test_user_can_reset_password_with_valid_token_without_logging_in(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $this->postJson('/forgot-password', [
            'email' => 'john@example.com',
        ])->assertOk();

        $token = null;

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });

        $this->assertNotNull($token);

        $response = $this->postJson('/reset-password', [
            'token' => $token,
            'email' => 'john@example.com',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Your password has been reset.');

        $user->refresh();

        $this->assertTrue(Hash::check('new-secure-password', (string) $user->password));
        $this->assertGuest();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_reset_with_invalid_token_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $response = $this->postJson('/reset-password', [
            'token' => 'invalid-token',
            'email' => 'john@example.com',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_requests_are_throttled(): void
    {
        Notification::fake();

        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson('/forgot-password', [
                'email' => 'john@example.com',
            ])->assertOk();
        }

        $this->postJson('/forgot-password', [
            'email' => 'john@example.com',
        ])->assertTooManyRequests();
    }
}
