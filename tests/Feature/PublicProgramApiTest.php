<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use App\Support\MediaProgramContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicProgramApiTest extends TestCase
{
    use RefreshDatabase;

    /** @var non-empty-string */
    private const MINI_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    private function miniPngUpload(): UploadedFile
    {
        $binary = base64_decode(self::MINI_PNG_BASE64, true);
        $this->assertNotFalse($binary);

        return UploadedFile::fake()->createWithContent('b.png', $binary);
    }

    public function test_index_includes_only_active_programs_with_link_fields(): void
    {
        $u = User::factory()->create();

        $active = Program::factory()->for($u)->create([
            'is_active' => true,
            'name' => 'A Active',
        ]);

        Program::factory()->for($u)->create([
            'is_active' => false,
        ]);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();

        $r->assertJsonPath('data.0.id', $active->getKey());
        $r->assertJsonPath('data.0.name', 'A Active');
        $r->assertJsonPath('data.0.path_segment', (string) $active->fresh()->slug);
    }

    public function test_index_uses_slug_in_path_segment_when_set(): void
    {
        $u = User::factory()->create();

        $p = Program::factory()->for($u)->create([
            'is_active' => true,
            'name' => 'B With slug',
            'slug' => 'harbor-2026',
        ]);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();
        $r->assertJsonPath('data.0.path_segment', 'harbor-2026');
    }

    public function test_index_excludes_archived_programs(): void
    {
        $u = User::factory()->create();

        $listed = Program::factory()->for($u)->create([
            'is_active' => true,
            'is_archived' => false,
            'name' => 'Listed',
        ]);

        Program::factory()->for($u)->create([
            'is_active' => true,
            'is_archived' => true,
            'name' => 'Archived only',
        ]);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();
        $r->assertJsonPath('data.0.id', $listed->getKey());
        $r->assertJsonCount(1, 'data');
    }

    public function test_show_returns_404_for_archived_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->for($u)->create([
            'is_active' => true,
            'is_archived' => true,
            'name' => 'Gone',
            'slug' => 'archived-slug',
        ]);

        $this->getJson('/api/public/programs/archived-slug')
            ->assertNotFound();
    }

    public function test_show_resolves_by_slug_and_does_not_require_is_active(): void
    {
        $u = User::factory()->create();
        $p = Program::factory()->for($u)->create(['is_active' => false, 'name' => 'Off', 'slug' => 'summer-2025']);

        $this->getJson('/api/public/programs/summer-2025')
            ->assertOk()
            ->assertJsonPath('data.name', 'Off');
    }

    public function test_show_404_for_slug_with_wrong_case(): void
    {
        $u = User::factory()->create();
        Program::factory()->for($u)->create(['is_active' => true, 'slug' => 'summer-run']);

        $this->getJson('/api/public/programs/SummER-RuN')
            ->assertNotFound();
    }

    public function test_show_404_for_unknown_id(): void
    {
        $this->getJson('/api/public/programs/'.(string) Str::ulid())
            ->assertNotFound();
    }

    public function test_show_404_for_unknown_slug(): void
    {
        $this->getJson('/api/public/programs/no-such-slug-xyz-12345')
            ->assertNotFound();
    }

    public function test_index_exposes_image_url_for_first_image(): void
    {
        Storage::fake('public');

        $u = User::factory()->create();
        $p = Program::factory()->for($u)->create(['is_active' => true]);
        MediaProgramContext::run((string) $p->getKey(), function () use ($p): void {
            $p->addMedia($this->miniPngUpload())->toMediaCollection('images');
        });
        $p->refresh();
        $media = $p->getFirstMedia('images');
        $this->assertNotNull($media);
        $expected = $media->getFullUrl();
        $this->assertIsString($expected);
        $this->assertNotSame('', $expected);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();
        $r->assertJsonPath('data.0.image_url', $expected);
    }
}
