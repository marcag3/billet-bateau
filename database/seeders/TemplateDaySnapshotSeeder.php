<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\TemplateDay;
use Illuminate\Database\Seeder;

class TemplateDaySnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        TemplateDay::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'name' => '123',
            ],
            [],
        );
    }
}
