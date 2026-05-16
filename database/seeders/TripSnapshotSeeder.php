<?php

namespace Database\Seeders;

use App\Models\BoatType;
use App\Models\Product;
use App\Models\Program;
use App\Models\Trip;
use App\Models\WaterRoute;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TripSnapshotSeeder extends Seeder
{
    /**
     * One service day pattern (UTC departures) for snapshot program.
     *
     * @var list<array{time: string}>
     */
    private const array TRIP_SCHEDULE_BLUEPRINT = [
        ['time' => '14:00:00'],
        ['time' => '14:30:00'],
        ['time' => '15:00:00'],
        ['time' => '15:30:00'],
        ['time' => '16:00:00'],
        ['time' => '16:30:00'],
        ['time' => '17:00:00'],
        ['time' => '17:30:00'],
        ['time' => '18:00:00'],
        ['time' => '18:30:00'],
        ['time' => '19:00:00'],
        ['time' => '19:30:00'],
        ['time' => '20:00:00'],
        ['time' => '20:30:00'],
        ['time' => '21:00:00'],
        ['time' => '21:30:00'],
        ['time' => '22:00:00'],
        ['time' => '22:30:00'],
        ['time' => '23:00:00'],
    ];

    /**
     * @var list<string>
     */
    private const array SERVICE_DATES = [
        '2026-06-28',
        '2026-07-04',
        '2026-09-05',
    ];

    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        $boatType = BoatType::query()
            ->where('program_id', $program->getKey())
            ->where('name', 'Rabaska')
            ->firstOrFail();

        $waterRoutePie9 = WaterRoute::query()
            ->where('program_id', $program->getKey())
            ->where('name', 'pie9')
            ->firstOrFail();

        $product = Product::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'boat_type_id' => $boatType->getKey(),
                'water_route_id' => $waterRoutePie9->getKey(),
                'capacity' => 10,
            ],
            [
                'name' => 'Rabaska · pie9',
                'description' => null,
            ],
        );

        foreach (self::SERVICE_DATES as $date) {
            foreach (self::TRIP_SCHEDULE_BLUEPRINT as $row) {
                $scheduledAt = Carbon::parse("{$date} {$row['time']}", 'UTC');

                Trip::query()->updateOrCreate(
                    [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => $scheduledAt,
                    ],
                    [
                        'product_id' => $product->getKey(),
                    ],
                );
            }
        }
    }
}
