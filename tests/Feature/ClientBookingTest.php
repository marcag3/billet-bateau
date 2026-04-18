<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ClientBookingTest extends TestCase
{
    public function test_delete_booking_trigger_event()
    {
        $client = Client::factory()->allRentInfo()->create();

        $client->products()->sync([6]);
        $client->refresh();

        $booking1 = $client->bookings()->create([
            'for_date'=>today(),
            'trip_id'=>9, // kayak simple
            'number_of_adults'=>1,
            'number_of_teens'=>0,
            'number_of_children'=>0,
            'is_guided'=>true,
            'is_full_boat'=>true,
            'number_of_boats'=>1,
        ]);
        $booking1->refresh();

        $booking2 = $client->bookings()->create([
            'for_date'=>today(),
            'trip_id'=>58, // kayak simple
            'number_of_adults'=>1,
            'number_of_teens'=>0,
            'number_of_children'=>0,
            'is_guided'=>true,
            'is_full_boat'=>true,
            'number_of_boats'=>1,
        ]);
        $booking2->refresh();

        $this->assertNotNull($booking1->confirmed_at);
        $this->assertNull($booking2->confirmed_at);

        $response = $this->actingAs($client, 'client')
            ->deleteJson('/api/clients/'.$client->id.'/bookings/'.$booking1->id);

        $response->assertOk();
        $booking1->refresh();
        $booking2->refresh();
        $this->assertNotNull($booking1->deleted_at);
        $this->assertNotNull($booking2->confirmed_at);
    }
}
