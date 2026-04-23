<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TodoController extends Controller
{
    private function currentWriteTransactionId(): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => (string) DB::scalar('select pg_current_xact_id()::xid::text'),
            default => (string) random_int(1, 2_147_483_647),
        };
    }

    /**
     * @param  callable(): JsonResponse  $callback
     */
    private function respondIdempotent(Request $request, string $operation, callable $callback): JsonResponse
    {
        $user = $request->user();
        $keyHeader = $request->header('Idempotency-Key');

        if (! is_string($keyHeader) || $keyHeader === '' || strlen($keyHeader) > 255 || $user === null) {
            return $callback();
        }

        $cacheKey = sprintf(
            'todo_api:%s:%s:%s',
            $user->getAuthIdentifier(),
            $operation,
            hash('sha256', $keyHeader),
        );

        $cached = Cache::get($cacheKey);

        if (is_array($cached) && isset($cached['status'], $cached['json']) && is_array($cached['json'])) {
            return response()->json($cached['json'], (int) $cached['status']);
        }

        $response = $callback();

        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            Cache::put($cacheKey, [
                'status' => $response->getStatusCode(),
                'json' => $response->getData(true),
            ], now()->addHours(24));
        }

        return $response;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        return response()->json([
            'data' => Todo::query()
                ->where('user_id', $user->getAuthIdentifier())
                ->orderByDesc('updated_at')
                ->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        return $this->respondIdempotent($request, 'store', function () use ($request, $user): JsonResponse {
            $validated = $request->validate([
                'id' => ['nullable', 'uuid'],
                'title' => ['required', 'string', 'max:255'],
                'completed' => ['sometimes', 'boolean'],
            ]);

            $todo = null;
            $txid = null;

            DB::transaction(function () use ($validated, $user, &$todo, &$txid): void {
                $todo = Todo::query()->create([
                    'id' => $validated['id'] ?? (string) Str::uuid(),
                    'user_id' => $user->getAuthIdentifier(),
                    'title' => $validated['title'],
                    'completed' => $validated['completed'] ?? false,
                ]);

                $txid = $this->currentWriteTransactionId();
            });

            return response()->json([
                'data' => $todo,
                'txid' => $txid,
            ], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function update(Request $request, Todo $todo): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        if ((int) $todo->user_id !== (int) $user->getAuthIdentifier()) {
            abort(404);
        }

        return $this->respondIdempotent($request, 'update:'.$todo->getKey(), function () use ($request, $todo): JsonResponse {
            $validated = $request->validate([
                'title' => ['sometimes', 'string', 'max:255'],
                'completed' => ['sometimes', 'boolean'],
            ]);

            $txid = null;

            DB::transaction(function () use ($validated, $todo, &$txid): void {
                $todo->fill($validated);
                $todo->save();

                $txid = $this->currentWriteTransactionId();
            });

            return response()->json([
                'data' => $todo->fresh(),
                'txid' => $txid,
            ]);
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Todo $todo): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        if ((int) $todo->user_id !== (int) $user->getAuthIdentifier()) {
            abort(404);
        }

        return $this->respondIdempotent($request, 'destroy:'.$todo->getKey(), function () use ($todo): JsonResponse {
            $todoId = $todo->id;
            $txid = null;

            DB::transaction(function () use ($todo, &$txid): void {
                $todo->delete();
                $txid = $this->currentWriteTransactionId();
            });

            return response()->json([
                'id' => $todoId,
                'txid' => $txid,
            ]);
        });
    }
}
