<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Events\BookingSaving;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ConfirmBookingTest extends TestCase
{
    public function test_confirm_with_product()
    {
        $client = Client::factory()->allRentInfo()->create();

        $client->products()->sync([6]);
        $client->refresh();

        $booking = $client->bookings()->create([
            'for_date'=>today(),
            'trip_id'=>9, // kayak simple
            'number_of_adults'=>1,
            'number_of_teens'=>0,
            'number_of_children'=>0,
            'is_guided'=>true,
            'is_full_boat'=>true,
            'number_of_boats'=>1,

        ]);
        $booking->refresh();

        $this->assertNotNull($booking->confirmed_at);
    }

    public function test_confirm_with_subscription()
    {
        $client = Client::factory()->allRentInfo()->create();

        $client->subscriptions()->syncWithPivotValues([3], ['expiry_date'=>today()], false);
        $client->refresh();

        $booking = $client->bookings()->create([
            'for_date'=>today(),
            'trip_id'=>9, // kayak simple
            'number_of_adults'=>1,
            'number_of_teens'=>0,
            'number_of_children'=>0,
            'is_guided'=>true,
            'is_full_boat'=>false,
            'number_of_boats'=>1,
        ]);
        $booking->refresh();

        $this->assertNotNull($booking->confirmed_at);
    }
}
