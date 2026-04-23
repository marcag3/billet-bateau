<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class InstallController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json([
            'install_required' => $this->isInstallRequired(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->isInstallRequired()) {
            return response()->json([
                'message' => 'Application is already installed.',
            ], 409);
        }

        $validated = $request->validate([
            'organization_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        /** @var User $user */
        $user = DB::transaction(function () use ($validated): User {
            $createdUser = User::query()->create([
                'name' => 'Administrator',
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            AppSetting::query()->updateOrCreate(
                ['key' => 'organization_name'],
                ['value' => $validated['organization_name']],
            );

            return $createdUser;
        });

        $request->session()->regenerate();
        Cache::forever('app.installed', true);

        return response()->json([
            'user' => [
                'id' => $user->getAuthIdentifier(),
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    private function isInstallRequired(): bool
    {
        return ! Cache::rememberForever('app.installed', fn (): bool => User::query()->exists());
    }
}
