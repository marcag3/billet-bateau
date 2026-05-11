<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\TicketType;
use Illuminate\Database\Seeder;

class TicketTypeSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        TicketType::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'title' => 'Adulte',
            ],
            [
                'price_cents' => 0,
                'is_pay_what_you_can' => false,
                'min_per_purchase' => 1,
                'max_per_purchase' => null,
            ],
        );

        TicketType::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'title' => 'Enfant',
            ],
            [
                'price_cents' => 0,
                'is_pay_what_you_can' => false,
                'min_per_purchase' => 0,
                'max_per_purchase' => 2,
            ],
        );
    }
}
