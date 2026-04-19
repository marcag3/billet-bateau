<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class ElectricTokenControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_get_an_electric_token(): void
    {
        $response = $this->getJson('/api/electric/token');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_receives_a_short_lived_electric_token(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson('/api/electric/token');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'expires_at',
                'electric_url',
            ])
            ->assertJson([
                'token_type' => 'Bearer',
            ]);
    }

    public function test_logged_out_user_cannot_get_an_electric_token(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
        ]);

        $this->postJson('/login', [
            'email' => 'john@example.com',
            'password' => 'password',
        ])->assertOk();

        $this->postJson('/logout')->assertNoContent();
        Auth::forgetGuards();

        $response = $this->getJson('/api/electric/token');

        $response->assertUnauthorized();
    }
}
