<?php

namespace App\Http\Controllers\Api;

use App\Actions\PowerSync\ApplyPowerSyncUploadBatchAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PowerSyncUploadController extends Controller
{
    /**
     * Apply a PowerSync CRUD upload batch from the web client (FIFO, synchronous).
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $userId = (string) $user->getAuthIdentifier();

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $result = ApplyPowerSyncUploadBatchAction::run($payload, $userId);

        return response()->json($result->toArray());
    }
}
