<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\WaterRoute;
use Clickbar\Magellan\Data\Geometries\LineString;
use Clickbar\Magellan\Data\Geometries\Point;
use Illuminate\Database\Seeder;

class WaterRouteSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        $pie9 = LineString::make([
            Point::makeGeodetic(45.60910245372065, -73.63994121551515),
            Point::makeGeodetic(45.609583047351656, -73.64260196685792),
            Point::makeGeodetic(45.60019770553209, -73.64736557006837),
            Point::makeGeodetic(45.609329729916084, -73.63981246948244),
        ], srid: 4326);

        WaterRoute::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'name' => 'pie9',
            ],
            [
                'trace' => $pie9,
                'duration_minutes' => 60,
            ],
        );

        $olivier = LineString::make([
            Point::makeGeodetic(45.609168576315625, -73.64041328430177),
            Point::makeGeodetic(45.624111513992, -73.63552093505861),
            Point::makeGeodetic(45.63605099892453, -73.61989974975587),
            Point::makeGeodetic(45.6335913130642, -73.61715316772462),
            Point::makeGeodetic(45.62261139887237, -73.63105773925783),
            Point::makeGeodetic(45.617390685356376, -73.63492012023927),
            Point::makeGeodetic(45.60964873261118, -73.64015579223634),
        ], srid: 4326);

        WaterRoute::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'name' => 'olivier-charbonneau',
            ],
            [
                'trace' => $olivier,
                'duration_minutes' => 120,
            ],
        );
    }
}
