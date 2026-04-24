<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\PowerSync\PowerSyncUploadRouter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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

        $validated = $request->validate([
            'crud' => ['required', 'array', 'min:1'],
            'crud.*.op' => ['required', Rule::in(['PUT', 'PATCH', 'DELETE'])],
            'crud.*.type' => ['required', 'string', Rule::in(['todos', 'programs', 'addresses'])],
            'crud.*.id' => ['required', 'uuid'],
            'crud.*.data' => ['nullable', 'array'],
        ]);

        $userId = (int) $user->getAuthIdentifier();

        DB::transaction(function () use ($validated, $userId): void {
            foreach ($validated['crud'] as $entry) {
                /** @var array{op: string, type: string, id: string, data?: array<string, mixed>|null} $entry */
                $this->router->apply((string) $entry['type'], $entry, $userId);
            }
        });

        return response()->json(['ok' => true]);
    }
}
