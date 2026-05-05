<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Media;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class MediaDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_destroy_removes_boat_type_image_for_authorized_user(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);

        $upload = $this->actingAs($user)
            ->post('/api/media/boat_type/'.$boatType->getKey(), [
                'images' => [UploadedFile::fake()->image('b.png', 10, 10)],
            ])
            ->assertOk()
            ->json('data.0.uuid');

        $this->assertIsString($upload);
        $this->assertNotSame('', $upload);

        $this->actingAs($user)
            ->delete('/api/media/boat_type/'.$boatType->getKey().'/'.$upload)
            ->assertNoContent();

        $this->assertDatabaseMissing('media', [
            'uuid' => $upload,
        ]);
    }

    public function test_destroy_returns_404_when_media_not_on_attachable(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatTypeA = BoatType::factory()->create(['program_id' => $program->getKey()]);
        $boatTypeB = BoatType::factory()->create(['program_id' => $program->getKey()]);

        $this->actingAs($user)
            ->post('/api/media/boat_type/'.$boatTypeA->getKey(), [
                'images' => [UploadedFile::fake()->image('b.png', 10, 10)],
            ])
            ->assertOk();

        $uuid = Media::query()
            ->where('model_id', $boatTypeA->getKey())
            ->where('collection_name', 'images')
            ->value('uuid');
        $this->assertIsString($uuid);

        $this->actingAs($user)
            ->delete('/api/media/boat_type/'.$boatTypeB->getKey().'/'.$uuid)
            ->assertNotFound();
    }

    public function test_destroy_returns_404_for_unknown_media_uuid(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);

        $this->actingAs($user)
            ->delete('/api/media/boat_type/'.$boatType->getKey().'/'.(string) Str::uuid())
            ->assertNotFound();
    }

    public function test_destroy_returns_403_for_user_without_program_access(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $other = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $boatType = BoatType::factory()->create(['program_id' => $program->getKey()]);

        $this->actingAs($owner)
            ->post('/api/media/boat_type/'.$boatType->getKey(), [
                'images' => [UploadedFile::fake()->image('b.png', 10, 10)],
            ])
            ->assertOk();

        $uuid = Media::query()
            ->where('model_id', $boatType->getKey())
            ->where('collection_name', 'images')
            ->value('uuid');
        $this->assertIsString($uuid);

        $this->actingAs($other)
            ->delete('/api/media/boat_type/'.$boatType->getKey().'/'.$uuid)
            ->assertForbidden();
    }
}
