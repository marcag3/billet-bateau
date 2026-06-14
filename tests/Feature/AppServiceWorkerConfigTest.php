<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppServiceWorkerConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_sw_config_is_public_and_reflects_media_config(): void
    {
        User::factory()->create();

        config([
            'media.public_base_url' => 'https://cdn.example/app',
            'media.trusted_origins' => 'https://alt-cdn.example',
        ]);

        $response = $this->getJson('/app/sw-config.json');

        $response->assertOk();
        $response->assertJson([
            'publicBaseUrl' => 'https://cdn.example/app',
            'trustedImageOrigins' => [
                'https://cdn.example',
                'https://alt-cdn.example',
            ],
        ]);
    }

    public function test_sw_config_does_not_require_authentication(): void
    {
        User::factory()->create();

        config(['media.public_base_url' => 'http://localhost:9000/app']);

        $this->getJson('/app/sw-config.json')->assertOk();
    }
}
