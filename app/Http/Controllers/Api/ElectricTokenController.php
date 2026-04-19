<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use RuntimeException;

class ElectricTokenController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $secret = config('electric.secret');

        if (! is_string($secret) || $secret === '') {
            throw new RuntimeException('Electric secret is not configured.');
        }

        $issuedAt = Carbon::now();
        $expiresAt = $issuedAt->copy()->addSeconds(config('electric.jwt_ttl_seconds', 300));

        $claims = [
            'iss' => config('electric.jwt_issuer'),
            'aud' => config('electric.jwt_audience'),
            'sub' => (string) $user->getAuthIdentifier(),
            'iat' => $issuedAt->timestamp,
            'nbf' => $issuedAt->timestamp,
            'exp' => $expiresAt->timestamp,
            'user_id' => $user->getAuthIdentifier(),
            'email' => $user->email,
        ];

        return response()->json([
            'token' => JWT::encode($claims, $secret, 'HS256'),
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
            'electric_url' => config('electric.url'),
        ]);
    }
}
