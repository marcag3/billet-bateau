<?php

namespace App\Http\Controllers\Api;

use App\Actions\CancelPublicBookingAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PublicBookingCancelController extends Controller
{
    public function show(string $token, CancelPublicBookingAction $action): JsonResponse
    {
        $result = $action->preview($token);

        if ($result['valid'] !== true) {
            return response()->json([
                'valid' => false,
                'reason' => $result['reason'] ?? 'invalid',
            ]);
        }

        return response()->json([
            'valid' => true,
            'data' => $result['data'],
        ]);
    }

    public function cancel(string $token, CancelPublicBookingAction $action): JsonResponse
    {
        $preview = $action->cancel($token);

        return response()->json([
            'data' => $preview,
        ]);
    }
}
