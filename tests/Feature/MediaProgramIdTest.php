<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaProgramIdTest extends TestCase
{
    use RefreshDatabase;

    public function test_media_rows_set_program_id_from_attachable_without_request_context(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();

        $this->actingAs($user)
            ->post('/api/media/program/'.$program->getKey(), [
                'images' => [UploadedFile::fake()->image('p.png', 10, 10)],
            ])
            ->assertOk();

        $this->assertDatabaseHas('media', [
            'model_id' => $program->getKey(),
            'program_id' => $program->getKey(),
            'model_type' => Program::class,
        ]);

        $boatType = BoatType::factory()->for($user)->create([
            'program_id' => $program->getKey(),
        ]);

        $this->actingAs($user)
            ->post('/api/media/boat_type/'.$boatType->getKey(), [
                'images' => [UploadedFile::fake()->image('b.png', 10, 10)],
            ])
            ->assertOk();

        $this->assertDatabaseHas('media', [
            'model_id' => $boatType->getKey(),
            'program_id' => $program->getKey(),
            'model_type' => BoatType::class,
        ]);
    }
}
