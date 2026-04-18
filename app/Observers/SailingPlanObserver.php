<?php

namespace App\Observers;

use App\Models\Client;
use App\Models\SailingPlan;
use App\Models\Ticket;

class SailingPlanObserver
{
    public function updated(SailingPlan $sailingPlan)
    {
        if ($sailingPlan->status == 3) {
            $sailingPlan->boardings()
                ->whereHasMorph('boarding_item', Ticket::class)
                ->get()
                ->where('boarding_item.product.is_initiation', true)
                ->each(function ($boarding) use ($sailingPlan) {
                    $boarding->client->initiation_sailing_plan_id = $sailingPlan->id;
                    $boarding->push();
                });
        } elseif ($sailingPlan->status != 3) {
            Client::where('initiation_sailing_plan_id', $sailingPlan->id)->update(['initiation_sailing_plan_id'=>null]);
        }
    }

    public function deleted(SailingPlan $sailingPlan)
    {
        //TODO: sailing plan id is not on the tickets table anymore
        // Ticket::where('sailing_plan_id', $sailingPlan->id)->update(['sailing_plan_id'=>null]);

        Client::where('initiation_sailing_plan_id', $sailingPlan->id)->update(['initiation_sailing_plan_id'=>null]);

        $sailingPlan->clients()->detach();

        // $sailingPlan->boats()->detach();
    }
}
