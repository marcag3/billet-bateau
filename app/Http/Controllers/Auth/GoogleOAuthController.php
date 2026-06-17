<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class GoogleOAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $this->ensureGoogleOAuthConfigured();

        if ($request->filled('redirect')) {
            $request->session()->put('oauth.intended_url', $request->string('redirect')->toString());
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $this->ensureGoogleOAuthConfigured();

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException) {
            return $this->loginErrorRedirect('google_failed');
        } catch (Throwable) {
            return $this->loginErrorRedirect('google_failed');
        }

        $user = $this->resolveUser($googleUser);

        if ($user === null) {
            return $this->loginErrorRedirect('google_account_not_found');
        }

        $this->linkGoogleAccount($user, $googleUser);

        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();

        $intendedUrl = $request->session()->pull('oauth.intended_url', '/app');

        return redirect($intendedUrl);
    }

    private function ensureGoogleOAuthConfigured(): void
    {
        if (! filled(config('services.google.client_id'))) {
            throw new NotFoundHttpException;
        }
    }

    private function resolveUser(SocialiteUserContract $googleUser): ?User
    {
        $googleId = $googleUser->getId();

        if ($googleId !== null && $googleId !== '') {
            $userByGoogleId = User::query()->where('google_id', $googleId)->first();
            if ($userByGoogleId !== null) {
                return $userByGoogleId;
            }
        }

        $email = Str::lower(trim((string) $googleUser->getEmail()));
        if ($email === '') {
            return null;
        }

        return User::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();
    }

    private function linkGoogleAccount(User $user, SocialiteUser $googleUser): void
    {
        $googleId = $googleUser->getId();
        $updates = [];

        if (($user->google_id === null || $user->google_id === '') && $googleId !== null && $googleId !== '') {
            $updates['google_id'] = $googleId;
        }

        if ($user->email_verified_at === null && ($googleUser->getRaw()['email_verified'] ?? false) === true) {
            $updates['email_verified_at'] = now();
        }

        if ($updates !== []) {
            $user->forceFill($updates)->save();
        }
    }

    private function loginErrorRedirect(string $error): RedirectResponse
    {
        return redirect('/app/login?error='.$error);
    }
}
