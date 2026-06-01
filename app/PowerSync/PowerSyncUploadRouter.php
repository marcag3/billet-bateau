<?php

namespace App\PowerSync;

use App\Actions\PowerSync\ApplyBoatPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyBoatTypePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyBookingPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyBookingTicketPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyCheckInPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyGuidePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyPassengerPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyProductPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyProgramPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDayDatePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDayPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTemplateDaySlotPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTicketTypePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyTripPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyVoyageBoatPowerSyncCrudAction;
use App\Actions\PowerSync\ApplyVoyageGuidePowerSyncCrudAction;
use App\Actions\PowerSync\ApplyVoyagePowerSyncCrudAction;
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
            PowerSyncCrudType::Bookings => ApplyBookingPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::BookingTickets => ApplyBookingTicketPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Voyages => ApplyVoyagePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Passengers => ApplyPassengerPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::VoyageBoat => ApplyVoyageBoatPowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::VoyageGuide => ApplyVoyageGuidePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::Guides => ApplyGuidePowerSyncCrudAction::run($entry, $userId),
            PowerSyncCrudType::CheckIns => ApplyCheckInPowerSyncCrudAction::run($entry, $userId),
        };
    }
}
