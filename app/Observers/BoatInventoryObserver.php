<?php

namespace App\Observers;

use App\Models\BoatInventory;
use App\Models\Trip;

class BoatInventoryObserver
{
    public function deleting(BoatInventory $boatInventory)
    {
        $response = Trip::where('boat_inventory_id', $boatInventory->id)->withTrashed()->update(['boat_inventory_id'=>null]);
    }
}
