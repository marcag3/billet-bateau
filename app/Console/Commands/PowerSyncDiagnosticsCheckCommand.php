<?php

namespace App\Console\Commands;

use App\Support\PowerSync\PowerSyncDiagnosticsClient;
use App\Support\PowerSync\PowerSyncDiagnosticsIssueCollector;
use Illuminate\Console\Command;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use Sentry\Severity;
use Sentry\State\Scope;
use Throwable;

use function Sentry\captureMessage;
use function Sentry\withScope;

class PowerSyncDiagnosticsCheckCommand extends Command
{
    protected $signature = 'powersync:diagnostics-check';

    protected $description = 'Poll the PowerSync Diagnostics API and report replication issues.';

    public function handle(): int
    {
        if (! config('powersync.diagnostics_check_enabled')) {
            $this->info('PowerSync diagnostics check is disabled; skipping.');

            return self::SUCCESS;
        }

        $adminApiToken = config('powersync.admin_api_token');
        if (! is_string($adminApiToken) || $adminApiToken === '') {
            $this->info('PowerSync admin API token is not configured; skipping diagnostics check.');

            return self::SUCCESS;
        }

        $adminApiUrl = config('powersync.admin_api_url');
        if (! is_string($adminApiUrl) || $adminApiUrl === '') {
            $this->error('PowerSync admin API URL is not configured.');

            return self::FAILURE;
        }

        $client = new PowerSyncDiagnosticsClient($adminApiUrl, $adminApiToken);

        try {
            $diagnosticsData = $client->fetchDiagnosticsData();
        } catch (RequestException $exception) {
            $this->reportDiagnosticsFailure(
                'PowerSync diagnostics request failed',
                [
                    'admin_api_url' => $adminApiUrl,
                    'http_status' => $exception->response?->status(),
                    'response_body' => $exception->response?->body(),
                ],
                $exception,
            );

            $this->error('PowerSync diagnostics request failed.');

            return self::FAILURE;
        } catch (Throwable $exception) {
            $this->reportDiagnosticsFailure(
                'PowerSync diagnostics request failed',
                ['admin_api_url' => $adminApiUrl],
                $exception,
            );

            $this->error('PowerSync diagnostics request failed.');

            return self::FAILURE;
        }

        $issues = PowerSyncDiagnosticsIssueCollector::collect($diagnosticsData);

        if ($issues === []) {
            $this->info('PowerSync diagnostics check passed.');

            return self::SUCCESS;
        }

        $this->reportDiagnosticsFailure(
            'PowerSync replication diagnostics check failed',
            [
                'admin_api_url' => $adminApiUrl,
                'issue_count' => count($issues),
                'issues' => $issues,
            ],
        );

        foreach ($issues as $issue) {
            $this->error("[{$issue['scope']}] {$issue['message']}");
        }

        return self::FAILURE;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function reportDiagnosticsFailure(
        string $message,
        array $context,
        ?Throwable $exception = null,
    ): void {
        Log::error($message, $context);

        withScope(function (Scope $scope) use ($message, $context, $exception): void {
            $scope->setContext('powersync_diagnostics', $context);
            $scope->setLevel(Severity::error());

            if ($exception !== null) {
                $scope->setTag('powersync_diagnostics_failure', 'request');
            } else {
                $scope->setTag('powersync_diagnostics_failure', 'replication');
            }

            captureMessage($message);
        });
    }
}
