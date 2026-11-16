<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AddProgramIdToGuidesMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_backfill_copies_shared_guides_into_each_program_and_repoints_assignments(): void
    {
        $migration = $this->migration();
        $migration->down();

        $programA = Program::factory()->create();
        $programB = Program::factory()->create();
        $voyageA = Voyage::factory()->forTrip(Trip::factory()->forProgram($programA)->create())->create();
        $voyageB = Voyage::factory()->forTrip(Trip::factory()->forProgram($programB)->create())->create();

        $sharedGuideId = $this->legacyGuide('Shared');
        $assignmentA = $this->assign($voyageA, $sharedGuideId);
        $assignmentB = $this->assign($voyageB, $sharedGuideId);

        $staffUser = User::factory()->create();
        $programB->users()->attach($staffUser->getKey(), ['role' => 'admin']);
        $staffGuideId = $this->legacyGuide('Staffed', $staffUser->getKey());

        $orphanGuideId = $this->legacyGuide('Orphan');

        $migration->up();

        $guidesByProgram = DB::table('guides')->where('name', 'Shared')->pluck('program_id', 'id');
        $this->assertCount(2, $guidesByProgram);
        $this->assertEqualsCanonicalizing(
            [$programA->getKey(), $programB->getKey()],
            $guidesByProgram->values()->all(),
        );

        foreach ([[$assignmentA, $programA], [$assignmentB, $programB]] as [$assignmentId, $program]) {
            $guideId = DB::table('voyage_guide')->where('id', $assignmentId)->value('guide_id');
            $this->assertSame($program->getKey(), $guidesByProgram[$guideId]);
        }

        $this->assertDatabaseHas('guides', ['id' => $staffGuideId, 'program_id' => $programB->getKey()]);
        $this->assertDatabaseMissing('guides', ['id' => $orphanGuideId]);
    }

    private function migration(): Migration
    {
        return require database_path('migrations/2026_11_16_040835_add_program_id_to_guides_table.php');
    }

    private function legacyGuide(string $name, ?string $staffUserId = null): string
    {
        $id = (string) Str::ulid();
        DB::table('guides')->insert([
            'id' => $id,
            'name' => $name,
            'staff_user_id' => $staffUserId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function assign(Voyage $voyage, string $guideId): string
    {
        $id = (string) Str::ulid();
        DB::table('voyage_guide')->insert([
            'id' => $id,
            'voyage_id' => $voyage->getKey(),
            'guide_id' => $guideId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }
}
