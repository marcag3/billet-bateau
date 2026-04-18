<?php

namespace App\Observers;

use App\Models\Pass;
use Illuminate\Support\Facades\Log;

class PassObserver
{
    public function created(Pass $pass)
    {
        if ($pass->subscription->add_promotion_id) {
            $pass->coupon()->create([
                'client_id'=>$pass->client_id,
                'promotion_id'=>$pass->subscription->add_promotion_id,
            ]);
        }
    }

    public function forceDeleting(Pass $pass)
    {
        if ($pass->has('coupon')) {
            $pass->coupon->forceDelete();
        }
    }
}
