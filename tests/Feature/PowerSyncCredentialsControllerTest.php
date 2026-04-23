<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PowerSyncCredentialsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_fetch_powersync_credentials(): void
    {
        $this->getJson('/api/powersync/credentials')->assertUnauthorized();
    }

    public function test_authenticated_user_receives_endpoint_and_token(): void
    {
        config()->set('powersync.public_url', 'http://powersync.test');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/powersync/credentials');

        $response->assertOk();
        $response->assertJsonPath('endpoint', 'http://powersync.test');
        $this->assertIsString($response->json('token'));
        $this->assertNotSame('', $response->json('token'));
    }
}
