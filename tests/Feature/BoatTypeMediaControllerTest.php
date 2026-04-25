<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class BoatTypeMediaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_upload_boat_type_media(): void
    {
        $boatType = BoatType::factory()->create();

        $this->postJson('/api/boat-types/'.$boatType->getKey().'/media', [
            'images' => [UploadedFile::fake()->image('a.jpg', 10, 10)],
        ])->assertUnauthorized();
    }

    public function test_validation_requires_images_array(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/boat-types/'.$boatType->getKey().'/media', [])
            ->assertUnprocessable();
    }

    public function test_authenticated_user_can_upload_media_for_another_users_boat_type(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $boatType = BoatType::factory()->for($owner)->create();

        $this->actingAs($admin)->post('/api/boat-types/'.$boatType->getKey().'/media', [
            'images' => [UploadedFile::fake()->image('a.jpg', 10, 10)],
        ])->assertOk();

        $this->assertSame(1, $boatType->fresh()->getMedia('images')->count());
    }

    public function test_owner_can_attach_images(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->post('/api/boat-types/'.$boatType->getKey().'/media', [
            'images' => [UploadedFile::fake()->image('deck.jpg', 30, 30)],
        ])->assertOk()
            ->assertJsonPath('data.id', $boatType->getKey())
            ->assertJsonPath('data.images.0.name', 'deck');

        $this->assertSame(1, $boatType->fresh()->getMedia('images')->count());
    }
}
