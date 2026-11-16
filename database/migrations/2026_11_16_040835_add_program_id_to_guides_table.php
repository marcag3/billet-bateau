<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Scopes guides to a program. Existing global guides are copied into every program that
 * assigned them to a voyage (voyage assignments are repointed to the copy), unused guides go
 * to their staff user's programs, and guides with neither are deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guides', function (Blueprint $table): void {
            $table->foreignUlid('program_id')->nullable()->after('id')->constrained('programs')->cascadeOnDelete();
        });

        DB::transaction(function (): void {
            $usedPrograms = DB::table('voyage_guide')
                ->join('voyages', 'voyages.id', '=', 'voyage_guide.voyage_id')
                ->select('voyage_guide.guide_id', 'voyages.program_id')
                ->distinct()
                ->orderBy('voyages.program_id')
                ->get()
                ->groupBy('guide_id')
                ->map(fn (Collection $rows): array => $rows->pluck('program_id')->map(fn ($id): string => (string) $id)->all());

            foreach ($usedPrograms as $guideId => $programIds) {
                $this->distributeGuide((string) $guideId, $programIds, repointAssignments: true);
            }

            $unassigned = DB::table('guides')
                ->whereNull('program_id')
                ->whereNotNull('staff_user_id')
                ->get(['id', 'staff_user_id']);

            foreach ($unassigned as $guide) {
                $programIds = DB::table('program_user')
                    ->where('user_id', $guide->staff_user_id)
                    ->orderBy('program_id')
                    ->pluck('program_id')
                    ->map(fn ($id): string => (string) $id)
                    ->all();

                $this->distributeGuide((string) $guide->id, $programIds, repointAssignments: false);
            }

            DB::table('guides')->whereNull('program_id')->delete();
        });

        Schema::table('guides', function (Blueprint $table): void {
            $table->ulid('program_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('program_id');
        });
    }

    /**
     * The original row keeps the first program; every other program gets a copy.
     *
     * @param  list<string>  $programIds
     */
    private function distributeGuide(string $guideId, array $programIds, bool $repointAssignments): void
    {
        if ($programIds === []) {
            return;
        }

        $guide = DB::table('guides')->where('id', $guideId)->first();
        if ($guide === null) {
            return;
        }

        DB::table('guides')->where('id', $guideId)->update(['program_id' => array_shift($programIds)]);

        foreach ($programIds as $programId) {
            $copyId = (string) Str::ulid();

            DB::table('guides')->insert([
                'id' => $copyId,
                'program_id' => $programId,
                'name' => $guide->name,
                'staff_user_id' => $guide->staff_user_id,
                'created_at' => $guide->created_at,
                'updated_at' => now(),
            ]);

            if ($repointAssignments) {
                DB::table('voyage_guide')
                    ->where('guide_id', $guideId)
                    ->whereIn('voyage_id', DB::table('voyages')->select('id')->where('program_id', $programId))
                    ->update(['guide_id' => $copyId]);
            }
        }
    }
};
