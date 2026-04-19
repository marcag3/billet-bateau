<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TodoController extends Controller
{
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

            $txid = (int) DB::scalar('select pg_current_xact_id()::xid::text');
        });

        return response()->json([
            'data' => $todo,
            'txid' => $txid,
        ], 201);
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

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        $txid = null;

        DB::transaction(function () use ($validated, $todo, &$txid): void {
            $todo->fill($validated);
            $todo->save();

            $txid = (int) DB::scalar('select pg_current_xact_id()::xid::text');
        });

        return response()->json([
            'data' => $todo->fresh(),
            'txid' => $txid,
        ]);
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

        $todoId = $todo->id;
        $txid = null;

        DB::transaction(function () use ($todo, &$txid): void {
            $todo->delete();
            $txid = (int) DB::scalar('select pg_current_xact_id()::xid::text');
        });

        return response()->json([
            'id' => $todoId,
            'txid' => $txid,
        ]);
    }
}
