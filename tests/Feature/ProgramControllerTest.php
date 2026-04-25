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
            'slug' => 'spring-launch',
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
            'slug' => 'harbor-week',
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

        $addressId = (string) $response->json('data.address.id');
        $this->assertTrue(Str::isUuid($addressId));

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'address_id' => $addressId,
            'name' => 'Harbor week',
            'theme_color' => '#AABBCC',
            'slug' => 'harbor-week',
        ]);

        $this->assertDatabaseHas('addresses', [
            'id' => $addressId,
            'line_1' => '1 Wharf',
            'city' => 'Portville',
        ]);

        $response->assertJsonMissingPath('data.images');

        $program = Program::query()->with('address')->findOrFail($id);
        $this->assertCount(1, $program->getMedia('images'));
    }

    public function test_store_media_allows_any_authenticated_user(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $other = User::factory()->create();

        $program = Program::factory()->for($owner)->create();

        $image = $this->fakePngUpload('x.png');

        $this->actingAs($other)
            ->post('/api/media/program/'.$program->getKey(), [
                'images' => [$image],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.name', 'x');

        $program->refresh();
        $this->assertCount(1, $program->getMedia('images'));
    }

    public function test_store_media_appends_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();

        $image = $this->fakePngUpload('a.png');

        $this->actingAs($user)
            ->post('/api/media/program/'.$program->getKey(), [
                'images' => [$image],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.name', 'a');

        $program->refresh();
        $this->assertCount(1, $program->getMedia('images'));
    }

    public function test_guest_cannot_list_program_media(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();

        $this->getJson('/api/media/program/'.$program->getKey())->assertUnauthorized();
    }

    public function test_index_media_lists_program_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $program = Program::factory()->for($user)->create();
        $image = $this->fakePngUpload('list.png');

        $this->actingAs($user)
            ->post('/api/media/program/'.$program->getKey(), [
                'images' => [$image],
            ])
            ->assertOk();

        $this->actingAs($user)
            ->getJson('/api/media/program/'.$program->getKey())
            ->assertOk()
            ->assertJsonPath('data.0.name', 'list');
    }
}
