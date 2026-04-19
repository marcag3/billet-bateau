<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureApplicationIsInstalled
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Cache::rememberForever('app.installed', fn (): bool => User::query()->exists())) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('login')) {
            return response()->json([
                'message' => 'Setup is required before signing in.',
            ], 423);
        }

        return redirect()->route('app.setup');
    }
}
