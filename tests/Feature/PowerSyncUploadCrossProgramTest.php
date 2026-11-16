<?php

namespace Tests\Feature;

use App\Models\Boat;
use App\Models\BoatType;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\CheckIn;
use App\Models\Guide;
use App\Models\Passenger;
use App\Models\Product;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * A staff member of one program must not be able to rewrite another program's rows
 * by uploading a PUT with a foreign row id and their own parent ids.
 */
class PowerSyncUploadCrossProgramTest extends TestCase
{
    use RefreshDatabase;

    private User $attacker;

    private Program $attackerProgram;

    private Program $victimProgram;

    protected function setUp(): void
    {
        parent::setUp();

        $this->attacker = User::factory()->create();
        $this->attackerProgram = Program::factory()->withOwner($this->attacker)->create();
        $this->victimProgram = Program::factory()->withOwner(User::factory()->create())->create();
    }

    public function test_put_rejects_moving_another_programs_boat_type(): void
    {
        $boatType = BoatType::factory()->create(['program_id' => $this->victimProgram->getKey(), 'name' => 'Victim']);

        $this->upload('PUT', 'boat_types', $boatType->getKey(), [
            'program_id' => $this->attackerProgram->getKey(),
            'name' => 'Hijacked',
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('boat_types', [
            'id' => $boatType->getKey(),
            'program_id' => $this->victimProgram->getKey(),
            'name' => 'Victim',
        ]);
    }

    public function test_put_rejects_creating_a_boat_in_another_program(): void
    {
        $boatId = (string) Str::ulid();

        $this->upload('PUT', 'boats', $boatId, [
            'name' => 'Planted',
            'capacity' => 4,
            'program_id' => $this->victimProgram->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }

    public function test_put_rejects_moving_own_boat_into_another_program(): void
    {
        $boat = Boat::factory()->create(['program_id' => $this->attackerProgram->getKey()]);

        $this->upload('PUT', 'boats', $boat->getKey(), [
            'name' => 'Moved',
            'capacity' => 4,
            'program_id' => $this->victimProgram->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('boats', ['id' => $boat->getKey(), 'program_id' => $this->attackerProgram->getKey()]);
    }

    public function test_put_rejects_boat_with_another_programs_boat_type(): void
    {
        $foreignBoatType = BoatType::factory()->create(['program_id' => $this->victimProgram->getKey()]);
        $boatId = (string) Str::ulid();

        $response = $this->upload('PUT', 'boats', $boatId, [
            'name' => 'Borrowed type',
            'capacity' => 4,
            'boat_type_id' => $foreignBoatType->getKey(),
            'program_id' => $this->attackerProgram->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertSame(
            ['Boat type must belong to the same program.'],
            $response->json('results.0.errors')['data.boat_type_id'] ?? null,
        );

        $this->assertDatabaseMissing('boats', ['id' => $boatId]);
    }

    public function test_patch_rejects_moving_own_boat_into_another_program(): void
    {
        $boat = Boat::factory()->create(['program_id' => $this->attackerProgram->getKey()]);

        $this->upload('PATCH', 'boats', $boat->getKey(), [
            'program_id' => $this->victimProgram->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('boats', ['id' => $boat->getKey(), 'program_id' => $this->attackerProgram->getKey()]);
    }

    public function test_put_rejects_moving_another_programs_booking_ticket(): void
    {
        $victimTicket = BookingTicket::factory()->create([
            'booking_id' => Booking::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
            'ticket_type_id' => TicketType::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
            'name' => 'Victim passenger',
        ]);
        $attackerBooking = Booking::factory()->create(['program_id' => $this->attackerProgram->getKey()]);
        $attackerTicketType = TicketType::factory()->create(['program_id' => $this->attackerProgram->getKey()]);

        $this->upload('PUT', 'booking_tickets', $victimTicket->getKey(), [
            'booking_id' => $attackerBooking->getKey(),
            'ticket_type_id' => $attackerTicketType->getKey(),
            'name' => 'Stolen',
            'country' => 'CA',
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('booking_tickets', [
            'id' => $victimTicket->getKey(),
            'booking_id' => $victimTicket->booking_id,
            'name' => 'Victim passenger',
        ]);
    }

    public function test_put_rejects_moving_another_programs_passenger(): void
    {
        $victimPassenger = Passenger::factory()->create([
            'voyage_id' => $this->voyageIn($this->victimProgram)->getKey(),
        ]);
        $attackerVoyage = $this->voyageIn($this->attackerProgram);

        $this->upload('PUT', 'passengers', $victimPassenger->getKey(), [
            'voyage_id' => $attackerVoyage->getKey(),
            'name' => 'Stolen',
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('passengers', [
            'id' => $victimPassenger->getKey(),
            'voyage_id' => $victimPassenger->voyage_id,
        ]);
    }

    public function test_put_rejects_moving_another_programs_check_in(): void
    {
        $victimCheckIn = CheckIn::factory()->create([
            'voyage_id' => $this->voyageIn($this->victimProgram)->getKey(),
            'booking_id' => Booking::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
        ]);
        $trip = Trip::factory()->create([
            'program_id' => $this->attackerProgram->getKey(),
            'product_id' => Product::factory()->create(['program_id' => $this->attackerProgram->getKey()])->getKey(),
        ]);
        $attackerVoyage = Voyage::factory()->forTrip($trip)->create();
        $attackerBooking = Booking::factory()->create([
            'program_id' => $this->attackerProgram->getKey(),
            'trip_id' => $trip->getKey(),
        ]);

        $this->upload('PUT', 'check_ins', $victimCheckIn->getKey(), [
            'voyage_id' => $attackerVoyage->getKey(),
            'booking_id' => $attackerBooking->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('check_ins', [
            'id' => $victimCheckIn->getKey(),
            'voyage_id' => $victimCheckIn->voyage_id,
        ]);
    }

    public function test_put_rejects_moving_another_programs_voyage_guide_assignment(): void
    {
        $victimVoyage = $this->voyageIn($this->victimProgram);
        $assignmentId = (string) Str::ulid();
        DB::table('voyage_guide')->insert([
            'id' => $assignmentId,
            'voyage_id' => $victimVoyage->getKey(),
            'guide_id' => Guide::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $attackerVoyage = $this->voyageIn($this->attackerProgram);
        $attackerGuide = Guide::factory()->create(['program_id' => $this->attackerProgram->getKey()]);

        $this->upload('PUT', 'voyage_guide', $assignmentId, [
            'voyage_id' => $attackerVoyage->getKey(),
            'guide_id' => $attackerGuide->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('voyage_guide', ['id' => $assignmentId, 'voyage_id' => $victimVoyage->getKey()]);
    }

    public function test_put_rejects_moving_another_programs_voyage_boat_assignment(): void
    {
        $victimVoyage = $this->voyageIn($this->victimProgram);
        $assignmentId = (string) Str::ulid();
        DB::table('voyage_boat')->insert([
            'id' => $assignmentId,
            'voyage_id' => $victimVoyage->getKey(),
            'boat_id' => Boat::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $attackerVoyage = $this->voyageIn($this->attackerProgram);
        $attackerBoat = Boat::factory()->create(['program_id' => $this->attackerProgram->getKey()]);

        $this->upload('PUT', 'voyage_boat', $assignmentId, [
            'voyage_id' => $attackerVoyage->getKey(),
            'boat_id' => $attackerBoat->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('voyage_boat', ['id' => $assignmentId, 'voyage_id' => $victimVoyage->getKey()]);
    }

    public function test_put_rejects_passenger_linked_to_another_programs_check_in(): void
    {
        $foreignCheckIn = CheckIn::factory()->create([
            'voyage_id' => $this->voyageIn($this->victimProgram)->getKey(),
            'booking_id' => Booking::factory()->create(['program_id' => $this->victimProgram->getKey()])->getKey(),
        ]);
        $passengerId = (string) Str::ulid();

        $this->upload('PUT', 'passengers', $passengerId, [
            'voyage_id' => $this->voyageIn($this->attackerProgram)->getKey(),
            'name' => 'Linked',
            'check_in_id' => $foreignCheckIn->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseMissing('passengers', ['id' => $passengerId]);
    }

    public function test_patch_rejects_cancelling_booking_with_another_programs_voyage(): void
    {
        $booking = Booking::factory()->create(['program_id' => $this->attackerProgram->getKey()]);
        $foreignVoyage = $this->voyageIn($this->victimProgram);

        $this->upload('PATCH', 'bookings', $booking->getKey(), [
            'cancelled_by_voyage_id' => $foreignVoyage->getKey(),
        ])->assertJsonPath('results.0.status', 'rejected');

        $this->assertDatabaseHas('bookings', ['id' => $booking->getKey(), 'cancelled_by_voyage_id' => null]);
    }

    private function voyageIn(Program $program): Voyage
    {
        return Voyage::factory()->forTrip(Trip::factory()->forProgram($program)->create())->create();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upload(string $op, string $type, string $id, array $data): TestResponse
    {
        return $this->actingAs($this->attacker)->postJson('/api/powersync/upload', [
            'crud' => [
                ['op' => $op, 'type' => $type, 'id' => $id, 'data' => $data],
            ],
        ])->assertOk();
    }
}
