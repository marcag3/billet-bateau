<?php

namespace App\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;

final class PowerSyncUploadRouter
{
    public function __construct(
        private readonly ProgramPowerSyncUploadApplier $programs,
        private readonly AddressPowerSyncUploadApplier $addresses,
        private readonly BoatPowerSyncUploadApplier $boats,
        private readonly BoatTypePowerSyncUploadApplier $boatTypes,
        private readonly BoatProgramPowerSyncUploadApplier $boatProgram,
    ) {}

    public function apply(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $payload = $entry->toApplierPayload();

        match ($entry->type) {
            PowerSyncCrudType::Programs => $this->programs->apply($payload, $userId),
            PowerSyncCrudType::Addresses => $this->addresses->apply($payload, $userId),
            PowerSyncCrudType::Boats => $this->boats->apply($payload, $userId),
            PowerSyncCrudType::BoatTypes => $this->boatTypes->apply($payload, $userId),
            PowerSyncCrudType::BoatProgram => $this->boatProgram->apply($payload, $userId),
        };
    }
}
