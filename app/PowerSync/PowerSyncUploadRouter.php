<?php

namespace App\PowerSync;

final class PowerSyncUploadRouter
{
    public function __construct(
        private readonly TodoPowerSyncUploadApplier $todos,
        private readonly ProgramPowerSyncUploadApplier $programs,
        private readonly AddressPowerSyncUploadApplier $addresses,
    ) {}

    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(string $type, array $entry, int $userId): void
    {
        match ($type) {
            'todos' => $this->todos->apply($entry, $userId),
            'programs' => $this->programs->apply($entry, $userId),
            'addresses' => $this->addresses->apply($entry, $userId),
            default => throw new \RuntimeException('Unsupported PowerSync CRUD type: '.$type),
        };
    }
}
