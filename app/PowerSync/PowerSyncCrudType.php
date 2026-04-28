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

    case BoatProgram = 'boat_program';

    case Trips = 'trips';

    case WaterRoutes = 'water_routes';

    case TemplateDays = 'template_days';

    case TemplateDaySlots = 'template_day_slots';

    case TemplateDayDates = 'template_day_dates';
}
