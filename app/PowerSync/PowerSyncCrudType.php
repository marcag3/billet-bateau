<?php

namespace App\PowerSync;

/**
 * Wire values for PowerSync upload `crud[].type` (TanStack / client batch keys).
 */
enum PowerSyncCrudType: string
{
    case Programs = 'programs';

    case Addresses = 'addresses';

    case Boats = 'boats';

    case BoatTypes = 'boat_types';
}
