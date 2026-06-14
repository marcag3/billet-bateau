<?php

namespace Database\Seeders;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use App\Models\WaterRoute;
use Illuminate\Database\Seeder;

class TemplateDaySlotSnapshotSeeder extends Seeder
{
    /**
     * @return list<array{sort_order: int, departure_time: string, route: string}>
     */
    private static function slotDefinitions(): array
    {
        return [
            ['sort_order' => 0, 'departure_time' => '11:30:00', 'route' => 'pie9'],
            ['sort_order' => 1, 'departure_time' => '10:00:00', 'route' => 'pie9'],
            ['sort_order' => 2, 'departure_time' => '10:30:00', 'route' => 'pie9'],
            ['sort_order' => 3, 'departure_time' => '11:00:00', 'route' => 'pie9'],
            ['sort_order' => 5, 'departure_time' => '12:00:00', 'route' => 'pie9'],
            ['sort_order' => 6, 'departure_time' => '13:00:00', 'route' => 'pie9'],
            ['sort_order' => 8, 'departure_time' => '14:00:00', 'route' => 'pie9'],
            ['sort_order' => 9, 'departure_time' => '14:30:00', 'route' => 'pie9'],
            ['sort_order' => 10, 'departure_time' => '15:00:00', 'route' => 'pie9'],
            ['sort_order' => 11, 'departure_time' => '16:00:00', 'route' => 'pie9'],
            ['sort_order' => 12, 'departure_time' => '16:30:00', 'route' => 'pie9'],
            ['sort_order' => 13, 'departure_time' => '17:00:00', 'route' => 'pie9'],
            ['sort_order' => 14, 'departure_time' => '17:30:00', 'route' => 'pie9'],
            ['sort_order' => 15, 'departure_time' => '18:00:00', 'route' => 'pie9'],
            ['sort_order' => 16, 'departure_time' => '18:30:00', 'route' => 'pie9'],
            ['sort_order' => 17, 'departure_time' => '19:00:00', 'route' => 'pie9'],
            ['sort_order' => 18, 'departure_time' => '15:30:00', 'route' => 'pie9'],
            ['sort_order' => 19, 'departure_time' => '12:30:00', 'route' => 'olivier-charbonneau'],
        ];
    }

    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        $templateDay = TemplateDay::query()
            ->where('program_id', $program->getKey())
            ->where('name', '123')
            ->firstOrFail();

        $boatType = BoatType::query()
            ->where('program_id', $program->getKey())
            ->where('name', 'Rabaska')
            ->firstOrFail();

        $routeIds = WaterRoute::query()
            ->where('program_id', $program->getKey())
            ->pluck('id', 'name')
            ->all();

        foreach (self::slotDefinitions() as $row) {
            $routeName = $row['route'];
            $waterRouteId = $routeIds[$routeName] ?? null;
            if ($waterRouteId === null) {
                throw new \RuntimeException("Missing water route: {$routeName}");
            }

            TemplateDaySlot::query()->updateOrCreate(
                [
                    'template_day_id' => $templateDay->getKey(),
                    'sort_order' => $row['sort_order'],
                ],
                [
                    'departure_time' => $row['departure_time'],
                    'capacity' => 10,
                    'boat_type_id' => $boatType->getKey(),
                    'water_route_id' => $waterRouteId,
                    'internal_notes' => null,
                    'ticket_setup' => null,
                ],
            );
        }
    }
}
