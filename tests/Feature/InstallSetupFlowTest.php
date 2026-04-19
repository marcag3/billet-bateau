<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallSetupFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_status_reports_install_required_when_no_users_exist(): void
    {
        $response = $this->getJson('/setup/status');

        $response
            ->assertOk()
            ->assertJson([
                'install_required' => true,
            ]);
    }

    public function test_setup_status_reports_installed_when_user_exists(): void
    {
        User::factory()->create();

        $response = $this->getJson('/setup/status');

        $response
            ->assertOk()
            ->assertJson([
                'install_required' => false,
            ]);
    }

    public function test_guest_can_complete_setup_and_is_authenticated(): void
    {
        $response = $this->postJson('/setup', [
            'organization_name' => 'Acme Transport',
            'email' => 'admin@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@example.com');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'admin@example.com',
            'name' => 'Administrator',
        ]);
        $this->assertDatabaseHas('app_settings', [
            'key' => 'organization_name',
            'value' => 'Acme Transport',
        ]);
    }

    public function test_setup_submit_is_blocked_once_application_is_installed(): void
    {
        User::factory()->create();

        $response = $this->postJson('/setup', [
            'organization_name' => 'Acme Transport',
            'email' => 'admin@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertStatus(409)
            ->assertJson([
                'message' => 'Application is already installed.',
            ]);
    }

    public function test_login_endpoint_is_blocked_until_setup_is_completed(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'admin@example.com',
            'password' => 'Password123!',
        ]);

        $response
            ->assertStatus(423)
            ->assertJson([
                'message' => 'Setup is required before signing in.',
            ]);
    }

    public function test_guest_login_page_redirects_to_setup_until_installed(): void
    {
        $response = $this->get('/app/login');

        $response->assertRedirect(route('app.setup'));
    }

    public function test_guest_setup_page_is_still_accessible_after_install_to_boot_spa(): void
    {
        User::factory()->create();

        $response = $this->get('/app/setup');

        $response
            ->assertOk()
            ->assertSee('app-root', escape: false);
    }
}
