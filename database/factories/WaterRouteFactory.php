<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\WaterRoute;
use Clickbar\Magellan\Data\Geometries\LineString;
use Clickbar\Magellan\Data\Geometries\Point;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WaterRoute>
 */
class WaterRouteFactory extends Factory
{
    protected $model = WaterRoute::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $trace = LineString::make([
            Point::makeGeodetic(45.5017, -73.5673),
            Point::makeGeodetic(45.5080, -73.5540),
        ], srid: 4326);

        return [
            'id' => (string) Str::uuid(),
            'program_id' => Program::factory(),
            'name' => fake()->words(3, true),
            'trace' => $trace,
            'duration_minutes' => fake()->numberBetween(30, 240),
        ];
    }
}
