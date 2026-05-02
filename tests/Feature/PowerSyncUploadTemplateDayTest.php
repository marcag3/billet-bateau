<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use App\Models\Trip;
use App\Models\User;
use App\Models\WaterRoute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadTemplateDayTest extends TestCase
{
    use RefreshDatabase;

    public function test_put_creates_template_day_for_program_manager(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDayId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_days',
                    'id' => $templateDayId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Standard Saturday',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_days', [
            'id' => $templateDayId,
            'program_id' => $program->getKey(),
            'name' => 'Standard Saturday',
        ]);
    }

    public function test_put_template_day_forbids_non_member_program(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $program = Program::factory()->withOwner($owner)->create();
        $templateDayId = (string) Str::ulid();

        $this->actingAs($intruder)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_days',
                    'id' => $templateDayId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Blocked',
                    ],
                ],
            ],
        ])->assertForbidden();

        $this->assertDatabaseMissing('template_days', ['id' => $templateDayId]);
    }

    public function test_put_creates_template_day_slot(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        $slotId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_day_slots',
                    'id' => $slotId,
                    'data' => [
                        'template_day_id' => $templateDay->getKey(),
                        'sort_order' => 1,
                        'departure_time' => '10:15:00',
                        'capacity' => 20,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                        'internal_notes' => 'Bring extra life jackets',
                        'ticket_setup' => json_encode([
                            'policy' => 'custom',
                            'allowed_ticket_type_ids' => [(string) Str::ulid()],
                            'min_per_booking' => 1,
                            'max_per_booking' => 6,
                        ]),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_day_slots', [
            'id' => $slotId,
            'template_day_id' => $templateDay->getKey(),
            'departure_time' => '10:15:00',
            'capacity' => 20,
            'internal_notes' => 'Bring extra life jackets',
        ]);

        $slot = TemplateDaySlot::query()->whereKey($slotId)->first();
        $this->assertNotNull($slot);
        $this->assertIsArray($slot->ticket_setup);
        $this->assertSame('custom', $slot->ticket_setup['policy']);
    }

    public function test_put_template_day_slot_rejects_overlong_internal_notes(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $slotId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_day_slots',
                    'id' => $slotId,
                    'data' => [
                        'template_day_id' => $templateDay->getKey(),
                        'sort_order' => 1,
                        'departure_time' => '10:15:00',
                        'capacity' => 20,
                        'internal_notes' => str_repeat('x', 2001),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('template_day_slots', ['id' => $slotId]);
    }

    public function test_put_creates_template_day_date(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $rowId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'template_day_dates',
                    'id' => $rowId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'template_day_id' => $templateDay->getKey(),
                        'service_date' => '2026-07-04',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('template_day_dates', [
            'id' => $rowId,
            'program_id' => $program->getKey(),
            'template_day_id' => $templateDay->getKey(),
        ]);
    }

    public function test_put_trip_accepts_template_day_slot_in_same_program(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $slot = TemplateDaySlot::factory()->forTemplateDay($templateDay)->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $program->getKey()]);
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 12,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                        'template_day_slot_id' => $slot->getKey(),
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('trips', [
            'id' => $tripId,
            'template_day_slot_id' => $slot->getKey(),
        ]);
    }

    public function test_put_trip_rejects_template_day_slot_from_other_program(): void
    {
        $user = User::factory()->create();
        $programA = Program::factory()->withOwner($user)->create();
        $programB = Program::factory()->withOwner($user)->create();
        $slotB = TemplateDaySlot::factory()
            ->forTemplateDay(TemplateDay::factory()->forProgram($programB)->create())
            ->create();
        $boatType = BoatType::factory()->for($user)->create();
        $route = WaterRoute::factory()->create(['program_id' => $programA->getKey()]);
        $tripId = (string) Str::ulid();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'trips',
                    'id' => $tripId,
                    'data' => [
                        'program_id' => $programA->getKey(),
                        'scheduled_departure_at' => '2026-08-10T15:30:00.000Z',
                        'capacity' => 12,
                        'boat_type_id' => $boatType->getKey(),
                        'water_route_id' => $route->getKey(),
                        'template_day_slot_id' => $slotB->getKey(),
                    ],
                ],
            ],
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('trips', ['id' => $tripId]);
    }

    public function test_delete_template_day_slot_nulls_linked_trip_reference(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $templateDay = TemplateDay::factory()->forProgram($program)->create();
        $slot = TemplateDaySlot::factory()->forTemplateDay($templateDay)->create();
        $trip = Trip::factory()->forProgram($program)->create([
            'template_day_slot_id' => $slot->getKey(),
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'template_day_slots',
                    'id' => $slot->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseMissing('template_day_slots', ['id' => $slot->getKey()]);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->getKey(),
            'template_day_slot_id' => null,
        ]);
    }
}
