<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Events\BookingSaving;
use App\Models\Pass;
use App\Models\SailingPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SubscriptionBoardingTest extends TestCase
{
    public function test_is_boarding_possible_with_booking()
    {
        Event::fake([
            BookingSaving::class,
        ]);

        $booking = Booking::firstOrCreate([
            'client_id'=>6,
            'for_date'=>today(),
            'trip_id'=>31, //all days, kayak tandem (5), depart 10:00, arrivé 11:00, route 3
            'number_of_adults' => 2,
            'number_of_teens' => 0,
            'number_of_children' => 0,
            'is_guided'=> 1,
            'is_full_boat' => false,

        ]);

        $pass = Pass::firstOrCreate([
            'subscription_id'=>3,
            'client_id'=>4,
            'expiry_date'=>today(),
        ]);

        $this->assertTrue($pass->isBoardingPossible($booking));
    }

    public function test_is_boarding_possible_with_sailing_plan()
    {
        $sailingPlan = SailingPlan::firstOrCreate([
            'departure'=>today(),
            'planned_duration'=>60,
            'status'=>SailingPlan::PLANNED,
            'guide_id'=>1,
            'boat_category_id'=>1, //kayak
            'user_id'=>1,
            'route_id'=>3,
        ]);

        $pass = Pass::firstOrCreate([
            'subscription_id'=>3,
            'client_id'=>4,
            'expiry_date'=>today(),
        ]);

        $this->assertTrue($pass->isBoardingPossible($sailingPlan));
    }
}
