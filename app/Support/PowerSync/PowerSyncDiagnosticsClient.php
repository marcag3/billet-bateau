<?php

namespace App\Support\PowerSync;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

final class PowerSyncDiagnosticsClient
{
    private const int MAX_ATTEMPTS = 3;

    private const int RETRY_DELAY_MS = 1_000;

    public function __construct(
        private readonly string $adminApiUrl,
        private readonly string $adminApiToken,
    ) {}

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     * @throws ConnectionException
     */
    public function fetchDiagnosticsData(): array
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            try {
                return $this->requestDiagnosticsData();
            } catch (Throwable $exception) {
                $lastException = $exception;

                if ($attempt >= self::MAX_ATTEMPTS || ! $this->shouldRetry($exception)) {
                    throw $exception;
                }

                usleep(self::RETRY_DELAY_MS * 1_000);
            }
        }

        throw $lastException ?? new RuntimeException('PowerSync diagnostics request failed.');
    }

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     * @throws ConnectionException
     */
    private function requestDiagnosticsData(): array
    {
        $response = Http::timeout(15)
            ->acceptJson()
            ->withToken($this->adminApiToken)
            ->post($this->diagnosticsEndpoint());

        $response->throw();

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new RuntimeException('PowerSync diagnostics response was not JSON.');
        }

        $data = $payload['data'] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException('PowerSync diagnostics response missing data.');
        }

        return $data;
    }

    private function shouldRetry(Throwable $exception): bool
    {
        if ($exception instanceof ConnectionException) {
            return true;
        }

        if ($exception instanceof RequestException) {
            return $exception->response->serverError();
        }

        return false;
    }

    private function diagnosticsEndpoint(): string
    {
        return rtrim($this->adminApiUrl, '/').'/api/admin/v1/diagnostics';
    }
}
