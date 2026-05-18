<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicProgramApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_includes_only_active_programs_with_link_fields(): void
    {
        $u = User::factory()->create();

        $active = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'name' => 'A Active',
        ]);

        Program::factory()->withOwner($u)->create([
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

        $p = Program::factory()->withOwner($u)->create([
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

        $listed = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'name' => 'Listed',
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'name' => 'Past season',
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();
        $r->assertJsonPath('data.0.id', $listed->getKey());
        $r->assertJsonCount(1, 'data');
    }

    public function test_show_returns_404_for_archived_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'name' => 'Gone',
            'slug' => 'archived-slug',
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $this->getJson('/api/public/programs/archived-slug')
            ->assertNotFound();
    }

    public function test_show_resolves_by_slug_and_does_not_require_is_active(): void
    {
        $u = User::factory()->create();
        $p = Program::factory()->withOwner($u)->create(['is_active' => false, 'name' => 'Off', 'slug' => 'summer-2025']);

        $this->getJson('/api/public/programs/summer-2025')
            ->assertOk()
            ->assertJsonPath('data.name', 'Off');
    }

    public function test_show_404_for_slug_with_wrong_case(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create(['is_active' => true, 'slug' => 'summer-run']);

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

    public function test_index_exposes_image_url_for_banner(): void
    {
        config(['media.public_base_url' => 'http://localhost:9000/app']);

        $u = User::factory()->create();
        $key = 'uploads/01ARZ3NDEKTSV4RRFFQ69G5FAV.png';
        $expected = 'http://localhost:9000/app/'.$key;
        Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'banner_object_key' => $key,
        ]);

        $r = $this->getJson('/api/public/programs');
        $r->assertOk();
        $r->assertJsonPath('data.0.image_url', $expected);
    }
}
