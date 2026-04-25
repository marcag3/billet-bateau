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

        $this->postJson('/api/media/boat_type/'.$boatType->getKey(), [
            'images' => [UploadedFile::fake()->image('a.jpg', 10, 10)],
        ])->assertUnauthorized();
    }

    public function test_validation_requires_images_array(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->postJson('/api/media/boat_type/'.$boatType->getKey(), [])
            ->assertUnprocessable();
    }

    public function test_authenticated_user_can_upload_media_for_another_users_boat_type(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $boatType = BoatType::factory()->for($owner)->create();

        $this->actingAs($other)->post('/api/media/boat_type/'.$boatType->getKey(), [
            'images' => [UploadedFile::fake()->image('a.jpg', 10, 10)],
        ])->assertOk();

        $this->assertSame(1, $boatType->fresh()->getMedia('images')->count());
    }

    public function test_owner_can_attach_images(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->post('/api/media/boat_type/'.$boatType->getKey(), [
            'images' => [UploadedFile::fake()->image('deck.jpg', 30, 30)],
        ])->assertOk()
            ->assertJsonPath('data.0.name', 'deck');

        $this->assertSame(1, $boatType->fresh()->getMedia('images')->count());
    }

    public function test_guest_cannot_list_boat_type_media(): void
    {
        $boatType = BoatType::factory()->create();

        $this->getJson('/api/media/boat_type/'.$boatType->getKey())->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_another_users_boat_type_media(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $boatType = BoatType::factory()->for($owner)->create();

        $this->actingAs($owner)->post('/api/media/boat_type/'.$boatType->getKey(), [
            'images' => [UploadedFile::fake()->image('list.jpg', 20, 20)],
        ])->assertOk();

        $this->actingAs($other)->getJson('/api/media/boat_type/'.$boatType->getKey())
            ->assertOk()
            ->assertJsonPath('data.0.name', 'list');
    }

    public function test_owner_can_list_attached_images(): void
    {
        $user = User::factory()->create();
        $boatType = BoatType::factory()->for($user)->create();

        $this->actingAs($user)->post('/api/media/boat_type/'.$boatType->getKey(), [
            'images' => [UploadedFile::fake()->image('deck.jpg', 30, 30)],
        ])->assertOk();

        $this->actingAs($user)->getJson('/api/media/boat_type/'.$boatType->getKey())
            ->assertOk()
            ->assertJsonPath('data.0.name', 'deck');
    }
}
