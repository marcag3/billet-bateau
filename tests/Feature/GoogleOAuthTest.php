<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleOAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.client_id' => 'test-google-client-id',
            'services.google.client_secret' => 'test-google-client-secret',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
        ]);
    }

    public function test_redirect_route_returns_google_authorization_redirect_when_configured(): void
    {
        User::factory()->create();
        Socialite::fake('google');

        $response = $this->get('/auth/google/redirect');

        $response->assertRedirect('https://socialite.fake/google/authorize');
    }

    public function test_redirect_route_returns_not_found_when_google_is_not_configured(): void
    {
        User::factory()->create();
        config(['services.google.client_id' => null]);

        $response = $this->get('/auth/google/redirect');

        $response->assertNotFound();
    }

    public function test_existing_user_can_sign_in_via_google_callback_and_google_id_is_linked(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'john@example.com',
            'google_id' => null,
        ]);

        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-123',
            'email' => 'john@example.com',
            'email_verified' => true,
        ]));

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/app');
        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertSame('google-123', $user->google_id);
        $this->assertNotNull($user->email_verified_at);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'john@example.com');
    }

    public function test_existing_google_id_logs_in_without_overwriting_linked_account(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'google_id' => 'google-123',
        ]);

        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-123',
            'email' => 'john@example.com',
            'email_verified' => true,
        ]));

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect('/app');
        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertSame('google-123', $user->google_id);
    }

    public function test_unknown_google_email_redirects_to_login_with_error_and_does_not_authenticate(): void
    {
        User::factory()->create();

        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-unknown',
            'email' => 'unknown@example.com',
            'email_verified' => true,
        ]));

        $response = $this->get('/auth/google/callback');

        $response
            ->assertRedirect('/app/login?error=google_account_not_found');
        $this->assertGuest();
    }

    public function test_redirect_route_preserves_intended_url_for_callback(): void
    {
        User::factory()->create();
        Socialite::fake('google');

        $this->get('/auth/google/redirect?redirect='.urlencode('/app/programs'))
            ->assertRedirect('https://socialite.fake/google/authorize');

        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-123',
            'email' => 'john@example.com',
            'email_verified' => true,
        ]));

        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $this->get('/auth/google/callback')
            ->assertRedirect('/app/programs');
    }
}
