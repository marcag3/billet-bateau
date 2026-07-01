<?php

namespace Tests\Feature;

use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class PowerSyncCompactCommandTest extends TestCase
{
    public function test_powersync_compact_skips_when_service_not_embedded(): void
    {
        config(['powersync.service_entry' => '/nonexistent/powersync/service/lib/entry.js']);

        $this->artisan('powersync:compact')
            ->expectsOutput('PowerSync service is not embedded in this image; skipping compaction.')
            ->assertSuccessful();
    }

    public function test_powersync_compact_invokes_entrypoint_with_required_environment(): void
    {
        $tmpdir = sys_get_temp_dir().'/powersync-compact-test-'.uniqid();
        mkdir($tmpdir, 0777, true);

        $serviceEntry = $tmpdir.'/entry.js';
        touch($serviceEntry);

        $entrypoint = $tmpdir.'/entrypoint.sh';
        file_put_contents($entrypoint, "#!/bin/sh\nexit 0\n");
        chmod($entrypoint, 0755);

        config([
            'powersync.service_entry' => $serviceEntry,
            'powersync.entrypoint' => $entrypoint,
            'powersync.config_path' => '/config/service.yaml',
            'powersync.port' => 8080,
            'powersync.data_source_uri' => 'postgresql://powersync:password@pgsql:5432/database?sslmode=disable',
            'powersync.storage_source_uri' => 'postgresql://root:secret@pgsql:5432/powersync_storage?sslmode=disable',
            'powersync.jwt_secret' => 'powersync-local-poc-secret-32_bytes!',
            'powersync.admin_api_token' => 'powersync-local-admin-token',
            'powersync.compact_node_options' => '--max-old-space-size-percentage=80',
        ]);

        Process::fake([
            '*' => Process::result(exitCode: 0),
        ]);

        $this->artisan('powersync:compact')
            ->expectsOutputToContain('PowerSync compact completed')
            ->assertSuccessful();

        Process::assertRan(function (PendingProcess $process) use ($entrypoint): bool {
            if ($process->command !== ['/bin/sh', $entrypoint, 'compact']) {
                return false;
            }

            return $process->environment['POWERSYNC_CONFIG_PATH'] === '/config/service.yaml'
                && $process->environment['PS_PORT'] === '8080'
                && $process->environment['PS_DATA_SOURCE_URI'] === 'postgresql://powersync:password@pgsql:5432/database?sslmode=disable'
                && $process->environment['PS_STORAGE_SOURCE_URI'] === 'postgresql://root:secret@pgsql:5432/powersync_storage?sslmode=disable'
                && $process->environment['PS_JWT_SECRET'] === 'powersync-local-poc-secret-32_bytes!'
                && $process->environment['PS_ADMIN_API_TOKEN'] === 'powersync-local-admin-token'
                && $process->environment['NODE_OPTIONS'] === '--max-old-space-size-percentage=80';
        });
    }

    public function test_powersync_compact_fails_when_entrypoint_exits_non_zero(): void
    {
        $tmpdir = sys_get_temp_dir().'/powersync-compact-test-'.uniqid();
        mkdir($tmpdir, 0777, true);

        $serviceEntry = $tmpdir.'/entry.js';
        touch($serviceEntry);

        $entrypoint = $tmpdir.'/entrypoint.sh';
        file_put_contents($entrypoint, "#!/bin/sh\nexit 1\n");
        chmod($entrypoint, 0755);

        config([
            'powersync.service_entry' => $serviceEntry,
            'powersync.entrypoint' => $entrypoint,
            'powersync.jwt_secret' => 'powersync-local-poc-secret-32_bytes!',
        ]);

        Process::fake([
            '*' => Process::result(exitCode: 1, errorOutput: 'compact failed'),
        ]);

        $this->artisan('powersync:compact')
            ->expectsOutputToContain('PowerSync compact failed')
            ->expectsOutput('compact failed')
            ->assertFailed();
    }
}
