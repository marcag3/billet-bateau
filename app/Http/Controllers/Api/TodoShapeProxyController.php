<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TodoShapeProxyController extends Controller
{
    private const CONTINUITY_PARAMS = [
        'cursor',
        'handle',
        'live',
        'offset',
        'replica',
        'shape_id',
    ];

    /**
     * Proxy Electric shape requests for the current user.
     */
    public function __invoke(Request $request): StreamedResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $shapeQuery = $this->buildShapeQuery($request, (int) $user->getAuthIdentifier());
        $electricResponse = $this->requestShapeStream($shapeQuery);

        return response()->stream(
            function () use ($electricResponse): void {
                $stream = $electricResponse->toPsrResponse()->getBody();

                while (! $stream->eof()) {
                    echo $stream->read(8192);
                    flush();
                }
            },
            $electricResponse->status(),
            $this->prepareProxyHeaders($electricResponse),
        );
    }

    /**
     * @return array<string, string>
     */
    private function buildShapeQuery(Request $request, int $userId): array
    {
        $apiSecret = (string) config('electric.api_secret');

        if ($apiSecret === '') {
            throw new RuntimeException('Electric API secret is not configured.');
        }

        $query = [
            'table' => 'todos',
            'where' => "user_id = {$userId}",
            'source_id' => (string) config('electric.source_id'),
            'api_secret' => $apiSecret,
        ];

        foreach (self::CONTINUITY_PARAMS as $continuityParam) {
            $value = $request->query($continuityParam);

            if ($value !== null && $value !== '') {
                $query[$continuityParam] = (string) $value;
            }
        }

        return $query;
    }

    /**
     * @param  array<string, string>  $query
     */
    private function requestShapeStream(array $query): HttpResponse
    {
        return Http::withOptions(['stream' => true])
            ->accept($this->acceptedContentType())
            ->connectTimeout(10)
            ->timeout(0)
            ->get($this->shapeUrl(), $query)
            ->throw();
    }

    private function shapeUrl(): string
    {
        $serviceUrl = rtrim((string) config('electric.service_url'), '/');

        return "{$serviceUrl}/v1/shape";
    }

    private function acceptedContentType(): string
    {
        return request()->header('Accept', 'application/json');
    }

    /**
     * @return array<string, string>
     */
    private function prepareProxyHeaders(HttpResponse $electricResponse): array
    {
        $headers = [];

        foreach ($electricResponse->headers() as $headerName => $headerValues) {
            $lowerHeaderName = strtolower($headerName);

            if (in_array($lowerHeaderName, [
                'connection',
                'keep-alive',
                'proxy-authenticate',
                'proxy-authorization',
                'te',
                'trailer',
                'transfer-encoding',
                'upgrade',
            ], true)) {
                continue;
            }

            $headers[$headerName] = implode(', ', $headerValues);
        }

        $existingVary = $headers['Vary'] ?? '';
        $varyValues = collect(explode(',', $existingVary))
            ->map(fn (string $value): string => trim($value))
            ->filter()
            ->push('Cookie')
            ->unique(fn (string $value): string => strtolower($value))
            ->implode(', ');

        $headers['Vary'] = $varyValues;

        return $headers;
    }
}
