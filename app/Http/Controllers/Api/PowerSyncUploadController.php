<?php

namespace App\Http\Controllers\Api;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\PowerSyncUploadBatchData;
use App\Http\Controllers\Controller;
use App\PowerSync\PowerSyncUploadRouter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PowerSyncUploadController extends Controller
{
    public function __construct(
        private readonly PowerSyncUploadRouter $router,
    ) {}

    /**
     * Apply a PowerSync CRUD upload batch from the web client (FIFO, synchronous).
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $batch = PowerSyncUploadBatchData::from($request);

        $userId = (int) $user->getAuthIdentifier();

        DB::transaction(function () use ($batch, $userId): void {
            foreach ($batch->crud as $entryPayload) {
                $entry = PowerSyncCrudEntryData::from($entryPayload);
                $this->router->apply($entry, $userId);
            }
        });

        return response()->json(['ok' => true]);
    }
}
