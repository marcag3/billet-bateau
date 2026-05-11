<?php

namespace Database\Seeders;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use App\Models\Trip;
use App\Models\WaterRoute;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TripSnapshotSeeder extends Seeder
{
    /**
     * One service day pattern (UTC departures) keyed to template slots on program `123`.
     *
     * @var list<array{time: string, slot: ?array{sort: int, departure: string, route: string}}>
     */
    private const array TRIP_SCHEDULE_BLUEPRINT = [
        ['time' => '14:00:00', 'slot' => ['sort' => 1, 'departure' => '10:00:00', 'route' => 'pie9']],
        ['time' => '14:30:00', 'slot' => ['sort' => 2, 'departure' => '10:30:00', 'route' => 'pie9']],
        ['time' => '15:00:00', 'slot' => ['sort' => 3, 'departure' => '11:00:00', 'route' => 'pie9']],
        ['time' => '15:30:00', 'slot' => ['sort' => 0, 'departure' => '11:30:00', 'route' => 'pie9']],
        ['time' => '16:00:00', 'slot' => ['sort' => 5, 'departure' => '12:00:00', 'route' => 'pie9']],
        ['time' => '16:30:00', 'slot' => null],
        ['time' => '17:00:00', 'slot' => ['sort' => 6, 'departure' => '13:00:00', 'route' => 'pie9']],
        ['time' => '17:30:00', 'slot' => null],
        ['time' => '18:00:00', 'slot' => ['sort' => 8, 'departure' => '14:00:00', 'route' => 'pie9']],
        ['time' => '18:30:00', 'slot' => ['sort' => 9, 'departure' => '14:30:00', 'route' => 'pie9']],
        ['time' => '19:00:00', 'slot' => ['sort' => 10, 'departure' => '15:00:00', 'route' => 'pie9']],
        ['time' => '19:30:00', 'slot' => ['sort' => 18, 'departure' => '15:30:00', 'route' => 'pie9']],
        ['time' => '20:00:00', 'slot' => ['sort' => 11, 'departure' => '16:00:00', 'route' => 'pie9']],
        ['time' => '20:30:00', 'slot' => ['sort' => 12, 'departure' => '16:30:00', 'route' => 'pie9']],
        ['time' => '21:00:00', 'slot' => ['sort' => 13, 'departure' => '17:00:00', 'route' => 'pie9']],
        ['time' => '21:30:00', 'slot' => ['sort' => 14, 'departure' => '17:30:00', 'route' => 'pie9']],
        ['time' => '22:00:00', 'slot' => ['sort' => 15, 'departure' => '18:00:00', 'route' => 'pie9']],
        ['time' => '22:30:00', 'slot' => ['sort' => 16, 'departure' => '18:30:00', 'route' => 'pie9']],
        ['time' => '23:00:00', 'slot' => ['sort' => 17, 'departure' => '19:00:00', 'route' => 'pie9']],
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

        foreach (self::SERVICE_DATES as $date) {
            foreach (self::TRIP_SCHEDULE_BLUEPRINT as $row) {
                $scheduledAt = Carbon::parse("{$date} {$row['time']}", 'UTC');

                $slotId = null;
                if ($row['slot'] !== null) {
                    $slotId = $this->resolveTemplateDaySlotId(
                        $program,
                        $row['slot']['sort'],
                        $row['slot']['departure'],
                        $row['slot']['route'],
                    );
                }

                Trip::query()->updateOrCreate(
                    [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => $scheduledAt,
                        'template_day_slot_id' => $slotId,
                    ],
                    [
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $waterRoutePie9->getKey(),
                        'capacity' => 10,
                    ],
                );
            }
        }
    }

    private function resolveTemplateDaySlotId(
        Program $program,
        int $sortOrder,
        string $departureTime,
        string $routeName,
    ): string {
        $templateDay = TemplateDay::query()
            ->where('program_id', $program->getKey())
            ->where('name', '123')
            ->firstOrFail();

        $route = WaterRoute::query()
            ->where('program_id', $program->getKey())
            ->where('name', $routeName)
            ->firstOrFail();

        $slot = TemplateDaySlot::query()
            ->where('template_day_id', $templateDay->getKey())
            ->where('sort_order', $sortOrder)
            ->where('departure_time', $departureTime)
            ->where('water_route_id', $route->getKey())
            ->firstOrFail();

        return (string) $slot->getKey();
    }
}
