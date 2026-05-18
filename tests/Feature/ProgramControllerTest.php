<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProgramControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_program(): void
    {
        $this->postJson('/api/programs', [
            'name' => 'Spring launch',
            'description' => 'Details',
            'theme_color' => '#00AAFF',
            'slug' => 'spring-launch',
        ])->assertUnauthorized();
    }

    public function test_store_saves_address_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/api/programs', [
            'name' => 'Harbor week',
            'description' => 'Evening cruises',
            'theme_color' => '#aabbcc',
            'is_active' => true,
            'slug' => 'harbor-week',
            'start_date' => '2026-06-01',
            'end_date' => '2026-09-30',
            'address' => [
                'line_1' => '1 Wharf',
                'city' => 'Portville',
                'postal_code' => 'H0H0H0',
                'country' => 'CA',
            ],
        ]);

        $response->assertCreated();

        $id = (string) $response->json('data.id');
        $this->assertTrue(Str::isUlid($id));

        $this->assertSame('1 Wharf', $response->json('data.line_1'));
        $this->assertSame('Portville', $response->json('data.city'));

        $this->assertDatabaseHas('programs', [
            'id' => $id,
            'line_1' => '1 Wharf',
            'city' => 'Portville',
            'postal_code' => 'H0H0H0',
            'country' => 'CA',
            'name' => 'Harbor week',
            'theme_color' => '#AABBCC',
            'slug' => 'harbor-week',
            'is_active' => true,
            'is_archived' => false,
            'start_date' => '2026-06-01',
            'end_date' => '2026-09-30',
        ]);

        $this->assertDatabaseHas('program_user', [
            'program_id' => $id,
            'user_id' => $user->getAuthIdentifier(),
            'role' => 'owner',
        ]);

        $response->assertJsonPath('data.user_ids.0', (string) $user->getAuthIdentifier());

        $response->assertJsonMissingPath('data.images');

        $response->assertJsonPath('data.start_date', '2026-06-01');
        $response->assertJsonPath('data.end_date', '2026-09-30');

        $program = Program::query()->findOrFail($id);
        $this->assertNull($program->getImageUrl('banner'));
    }

    public function test_program_user_pivot_allows_multiple_users(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();

        $program = Program::factory()->withOwner($owner)->create();

        $program->users()->syncWithoutDetaching([(string) $collaborator->getAuthIdentifier()]);

        $program->load('users');
        $this->assertCount(2, $program->users);
        $this->assertTrue($program->users->contains('id', $owner->getKey()));
        $this->assertTrue($program->users->contains('id', $collaborator->getKey()));
    }

    public function test_store_rejects_end_date_before_start_date(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/programs', [
            'name' => 'Bad range',
            'description' => null,
            'theme_color' => '#00AAFF',
            'is_active' => true,
            'slug' => 'bad-range',
            'start_date' => '2026-09-01',
            'end_date' => '2026-06-01',
        ])->assertUnprocessable();
    }
}
