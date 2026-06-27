<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PowerSyncDiagnosticsCheckCommandTest extends TestCase
{
    public function test_powersync_diagnostics_check_skips_when_disabled(): void
    {
        config([
            'powersync.diagnostics_check_enabled' => false,
            'powersync.admin_api_token' => 'token',
        ]);

        $this->artisan('powersync:diagnostics-check')
            ->expectsOutput('PowerSync diagnostics check is disabled; skipping.')
            ->assertSuccessful();
    }

    public function test_powersync_diagnostics_check_skips_when_admin_token_missing(): void
    {
        config([
            'powersync.diagnostics_check_enabled' => true,
            'powersync.admin_api_token' => '',
        ]);

        $this->artisan('powersync:diagnostics-check')
            ->expectsOutput('PowerSync admin API token is not configured; skipping diagnostics check.')
            ->assertSuccessful();
    }

    public function test_powersync_diagnostics_check_passes_when_no_errors_reported(): void
    {
        config([
            'powersync.diagnostics_check_enabled' => true,
            'powersync.admin_api_url' => 'http://powersync:8080',
            'powersync.admin_api_token' => 'test-token',
        ]);

        Http::fake([
            'http://powersync:8080/api/admin/v1/diagnostics' => Http::response([
                'data' => [
                    'connections' => [
                        ['id' => 'default', 'connected' => true, 'errors' => []],
                    ],
                    'active_sync_rules' => [
                        'errors' => [],
                        'connections' => [],
                    ],
                ],
            ]),
        ]);

        $this->artisan('powersync:diagnostics-check')
            ->expectsOutput('PowerSync diagnostics check passed.')
            ->assertSuccessful();

        Http::assertSent(function ($request): bool {
            return $request->url() === 'http://powersync:8080/api/admin/v1/diagnostics'
                && $request->hasHeader('Authorization', 'Bearer test-token');
        });
    }

    public function test_powersync_diagnostics_check_fails_and_logs_when_replication_errors_present(): void
    {
        config([
            'powersync.diagnostics_check_enabled' => true,
            'powersync.admin_api_url' => 'http://powersync:8080',
            'powersync.admin_api_token' => 'test-token',
        ]);

        Http::fake([
            'http://powersync:8080/api/admin/v1/diagnostics' => Http::response([
                'data' => [
                    'connections' => [
                        ['id' => 'default', 'connected' => true, 'errors' => []],
                    ],
                    'active_sync_rules' => [
                        'errors' => ['replication stalled'],
                        'connections' => [],
                    ],
                ],
            ]),
        ]);

        $this->artisan('powersync:diagnostics-check')
            ->expectsOutput('[active_sync_rules] replication stalled')
            ->assertFailed();
    }

    public function test_powersync_diagnostics_check_fails_when_request_is_unsuccessful(): void
    {
        config([
            'powersync.diagnostics_check_enabled' => true,
            'powersync.admin_api_url' => 'http://powersync:8080',
            'powersync.admin_api_token' => 'test-token',
        ]);

        Http::fake([
            'http://powersync:8080/api/admin/v1/diagnostics' => Http::response('Unauthorized', 401),
        ]);

        $this->artisan('powersync:diagnostics-check')
            ->expectsOutput('PowerSync diagnostics request failed.')
            ->assertFailed();
    }
}
