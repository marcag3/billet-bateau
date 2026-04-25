<?php

namespace App\PowerSync;

final class PowerSyncUploadRouter
{
    public function __construct(
        private readonly ProgramPowerSyncUploadApplier $programs,
        private readonly AddressPowerSyncUploadApplier $addresses,
        private readonly BoatPowerSyncUploadApplier $boats,
        private readonly BoatTypePowerSyncUploadApplier $boatTypes,
    ) {}

    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(string $type, array $entry, int $userId): void
    {
        match ($type) {
            'programs' => $this->programs->apply($entry, $userId),
            'addresses' => $this->addresses->apply($entry, $userId),
            'boats' => $this->boats->apply($entry, $userId),
            'boat_types' => $this->boatTypes->apply($entry, $userId),
            default => throw new \RuntimeException('Unsupported PowerSync CRUD type: '.$type),
        };
    }
}
