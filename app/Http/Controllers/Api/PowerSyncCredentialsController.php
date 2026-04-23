<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PowerSyncTokenIssuer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PowerSyncCredentialsController extends Controller
{
    public function __construct(
        private readonly PowerSyncTokenIssuer $tokens,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $token = $this->tokens->issueForUserId((string) $user->getAuthIdentifier());

        return response()->json([
            'endpoint' => (string) config('powersync.public_url'),
            'token' => $token,
        ]);
    }
}
