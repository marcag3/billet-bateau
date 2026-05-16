<?php

namespace App\PowerSync;

use App\Actions\PowerSync\ApplyBoatPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyBoatTypePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyBookingTicketPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyProductPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyProgramPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDayDatePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDayPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDaySlotPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTicketTypePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTripPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyWaterRoutePowerSyncCrudAction;
use App\Data\PowerSync\PowerSyncCrudEntryData;

final class PowerSyncUploadRouter
{
    public function apply(PowerSyncCrudEntryData $entry, string $userId): void
    {
        match ($entry->type) {
            PowerSyncCrudType::Programs => ApplyProgramPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Products => ApplyProductPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Boats => ApplyBoatPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::BoatTypes => ApplyBoatTypePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Trips => ApplyTripPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::WaterRoutes => ApplyWaterRoutePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::TemplateDays => ApplyTemplateDayPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::TemplateDaySlots => ApplyTemplateDaySlotPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::TemplateDayDates => ApplyTemplateDayDatePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::TicketTypes => ApplyTicketTypePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::BookingTickets => ApplyBookingTicketPowerSyncCrudAction::run($entry, $userId),
        };
    }
}
