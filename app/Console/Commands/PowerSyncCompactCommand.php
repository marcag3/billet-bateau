<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class PowerSyncCompactCommand extends Command
{
    protected $signature = 'powersync:compact';

    protected $description = 'Compact PowerSync bucket operation history.';

    public function handle(): int
    {
        $serviceEntry = config('powersync.service_entry');
        if (! is_string($serviceEntry) || ! is_file($serviceEntry)) {
            $this->info('PowerSync service is not embedded in this image; skipping compaction.');

            return self::SUCCESS;
        }

        $entrypoint = config('powersync.entrypoint');
        if (! is_string($entrypoint) || ! is_file($entrypoint)) {
            $this->error('PowerSync entrypoint is not available.');

            return self::FAILURE;
        }

        $startedAt = microtime(true);

        $result = Process::timeout(3600)
            ->env($this->compactEnvironment())
            ->run(['/bin/sh', $entrypoint, 'compact']);

        $duration = round(microtime(true) - $startedAt, 1);

        if (! $result->successful()) {
            $this->error('PowerSync compact failed after '.$duration.'s.');
            $details = trim($result->errorOutput());
            if ($details === '') {
                $details = trim($result->output());
            }
            if ($details !== '') {
                $this->line($details);
            }

            return self::FAILURE;
        }

        $this->info('PowerSync compact completed in '.$duration.'s.');

        return self::SUCCESS;
    }

    /**
     * @return array<string, string>
     */
    private function compactEnvironment(): array
    {
        $env = [];

        $configPath = config('powersync.config_path');
        if (is_string($configPath) && $configPath !== '') {
            $env['POWERSYNC_CONFIG_PATH'] = $configPath;
        }

        $dataSourceUri = config('powersync.data_source_uri');
        if (is_string($dataSourceUri) && $dataSourceUri !== '') {
            $env['PS_DATA_SOURCE_URI'] = $dataSourceUri;
        }

        $storageSourceUri = config('powersync.storage_source_uri');
        if (is_string($storageSourceUri) && $storageSourceUri !== '') {
            $env['PS_STORAGE_SOURCE_URI'] = $storageSourceUri;
        }

        $jwtSecret = config('powersync.jwt_secret');
        if (is_string($jwtSecret) && $jwtSecret !== '') {
            $env['PS_JWT_SECRET'] = $jwtSecret;
        }

        $port = config('powersync.port');
        if (is_int($port) && $port > 0) {
            $env['PS_PORT'] = (string) $port;
        }

        $adminApiToken = config('powersync.admin_api_token');
        if (is_string($adminApiToken) && $adminApiToken !== '') {
            $env['PS_ADMIN_API_TOKEN'] = $adminApiToken;
        }

        $nodeOptions = config('powersync.compact_node_options');
        if (is_string($nodeOptions) && $nodeOptions !== '') {
            $env['NODE_OPTIONS'] = $nodeOptions;
        }

        return $env;
    }
}
