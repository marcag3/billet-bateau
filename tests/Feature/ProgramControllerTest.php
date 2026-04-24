<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProgramControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @var non-empty-string */
    private const MINI_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    private function fakePngUpload(string $filename = 'shot.png'): UploadedFile
    {
        $binary = base64_decode(self::MINI_PNG_BASE64, true);
        $this->assertNotFalse($binary);

        return UploadedFile::fake()->createWithContent($filename, $binary);
    }

    public function test_guest_cannot_create_program(): void
    {
        $this->postJson('/api/programs', [
            'name' => 'Spring launch',
            'description' => 'Details',
            'theme_color' => '#00AAFF',
        ])->assertUnauthorized();
    }

    public function test_store_creates_address_and_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $image = $this->fakePngUpload('banner.png');

        $response = $this->actingAs($user)->post('/api/programs', [
            'name' => 'Harbor week',
            'description' => 'Evening cruises',
            'theme_color' => '#aabbcc',
            'address' => [
                'line_1' => '1 Wharf',
                'city' => 'Portville',
                'postal_code' => 'H0H0H0',
                'country' => 'CA',
            ],
            'images' => [$image],
        ]);

        $response->assertCreated();

        $id = (string) $response->json('data.id');
        $this->assertTrue(Str::isUuid($id));

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'name' => 'Harbor week',
            'theme_color' => '#AABBCC',
        ]);

        $this->assertDatabaseHas('addresses', [
            'program_id' => $id,
            'line_1' => '1 Wharf',
            'city' => 'Portville',
        ]);

        $program = Program::query()->with('address')->findOrFail($id);
        $this->assertCount(1, $program->getMedia('images'));
    }

    public function test_store_media_requires_owner(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $other = User::factory()->create();

        $program = Program::factory()->for($owner)->create();

        $image = $this->fakePngUpload('x.png');

        $this->actingAs($other)
            ->post('/api/programs/'.$program->getKey().'/media', [
                'images' => [$image],
            ])
            ->assertForbidden();
    }

    public function test_store_media_appends_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();

        $image = $this->fakePngUpload('a.png');

        $this->actingAs($user)
            ->post('/api/programs/'.$program->getKey().'/media', [
                'images' => [$image],
            ])
            ->assertOk();

        $program->refresh();
        $this->assertCount(1, $program->getMedia('images'));
    }
}
