<?php

namespace App\Support\PowerSync;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class PowerSyncDiagnosticsClient
{
    public function __construct(
        private readonly string $adminApiUrl,
        private readonly string $adminApiToken,
    ) {}

    /**
     * @return array<string, mixed>
     *
     * @throws RequestException
     */
    public function fetchDiagnosticsData(): array
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

    private function diagnosticsEndpoint(): string
    {
        return rtrim($this->adminApiUrl, '/').'/api/admin/v1/diagnostics';
    }
}
