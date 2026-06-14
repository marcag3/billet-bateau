<?php

namespace Database\Seeders;

use App\Models\Boat;
use App\Models\BoatType;
use App\Models\Program;
use Illuminate\Database\Seeder;

class BoatSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        $boatType = BoatType::query()
            ->where('program_id', $program->getKey())
            ->where('name', 'Rabaska')
            ->firstOrFail();

        Boat::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'name' => 'rab1',
            ],
            [
                'boat_type_id' => $boatType->getKey(),
                'capacity' => 10,
                'notes' => null,
            ],
        );
    }
}
