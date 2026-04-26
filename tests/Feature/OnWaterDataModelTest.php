<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Boat;
use App\Models\Guide;
use App\Models\Passenger;
use App\Models\Program;
use App\Models\Trip;
use App\Models\Voyage;
use App\Models\WaterRoute;
use Clickbar\Magellan\Data\Geometries\LineString;
use Clickbar\Magellan\Data\Geometries\Point;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OnWaterDataModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function water_route_line_string_round_trips_through_database(): void
    {
        $trace = LineString::make([
            Point::makeGeodetic(45.5017, -73.5673),
            Point::makeGeodetic(45.5080, -73.5540),
        ], srid: 4326);

        $route = WaterRoute::factory()->create([
            'name' => 'Lachine Canal',
            'trace' => $trace,
            'duration_minutes' => 90,
        ]);

        $route->refresh();

        $this->assertInstanceOf(LineString::class, $route->trace);
        $this->assertSame(4326, $route->trace->getSrid());
        $points = $route->trace->getPoints();
        $this->assertCount(2, $points);
        $this->assertEqualsWithDelta(45.5017, $points[0]->getLatitude(), 0.0001);
        $this->assertEqualsWithDelta(-73.5673, $points[0]->getLongitude(), 0.0001);
    }

    #[Test]
    public function trip_loads_program_and_water_route(): void
    {
        $trip = Trip::factory()
            ->withWaterRoute()
            ->create();

        $trip->load(['program', 'waterRoute']);

        $this->assertTrue($trip->relationLoaded('program'));
        $this->assertTrue($trip->relationLoaded('waterRoute'));
        $this->assertSame((string) $trip->program_id, (string) $trip->program->getKey());
        $this->assertSame((string) $trip->water_route_id, (string) $trip->waterRoute->getKey());
    }

    #[Test]
    public function voyage_linked_to_trip_uses_null_scheduled_departure_at_on_voyage_row(): void
    {
        $trip = Trip::factory()->withWaterRoute()->create();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);

        $this->assertSame((string) $trip->getKey(), (string) $voyage->trip_id);
        $this->assertNull($voyage->scheduled_departure_at);
    }

    #[Test]
    public function passenger_count_is_row_count_per_voyage(): void
    {
        $voyage = Voyage::factory()->create();

        Passenger::factory()->count(4)->forVoyage($voyage)->create();

        $this->assertSame(4, $voyage->passengers()->count());
    }

    #[Test]
    public function estimated_arrival_follows_trip_departure_plus_voyage_route_duration(): void
    {
        $program = Program::factory()->create();
        $plannedRoute = WaterRoute::factory()->create([
            'program_id' => $program->getKey(),
            'duration_minutes' => 45,
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'water_route_id' => $plannedRoute->getKey(),
            'scheduled_departure_at' => '2026-06-01 10:00:00',
        ]);

        $actualRoute = WaterRoute::factory()->create([
            'program_id' => $program->getKey(),
            'duration_minutes' => 120,
        ]);

        $voyage = Voyage::factory()->forTrip($trip, $actualRoute)->create();

        $departure = $voyage->trip->scheduled_departure_at;
        $this->assertNotNull($departure);
        $eta = $departure->copy()->addMinutes($voyage->waterRoute->duration_minutes);
        $this->assertTrue($eta->equalTo($departure->copy()->addMinutes(120)));
    }

    #[Test]
    public function voyage_boat_and_voyage_guide_pivots_attach(): void
    {
        $voyage = Voyage::factory()->create();
        $boat = Boat::factory()->create(['user_id' => $voyage->user_id]);
        $guide = Guide::factory()->create(['user_id' => $voyage->user_id]);

        $voyage->boats()->attach($boat->getKey());
        $voyage->guides()->attach($guide->getKey());

        $voyage->load(['boats', 'guides']);

        $this->assertCount(1, $voyage->boats);
        $this->assertCount(1, $voyage->guides);
    }

    #[Test]
    public function boat_factory_still_persists_name_and_capacity(): void
    {
        $boat = Boat::factory()->create([
            'name' => 'Hull Alpha',
            'capacity' => 12,
        ]);

        $boat->refresh();

        $this->assertSame('Hull Alpha', $boat->name);
        $this->assertSame(12, $boat->capacity);
    }
}
