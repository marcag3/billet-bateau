<?php

namespace App\Providers;

use App\Models\User;
use App\Services\PowerSyncTokenIssuer;
use App\Support\ObjectStorage\ObjectStorage;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Lorisleiva\Actions\Facades\Actions;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PowerSyncTokenIssuer::class, fn (): PowerSyncTokenIssuer => PowerSyncTokenIssuer::fromConfig());

        $this->app->singleton(ObjectStorage::class, fn ($app): ObjectStorage => new ObjectStorage(
            $app->make(FilesystemManager::class),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Date::use(CarbonImmutable::class);

        Model::shouldBeStrict(! $this->app->isProduction());

        if ($this->app->runningInConsole() && is_dir(app_path('Actions'))) {
            Actions::registerCommands();
        }

        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        RateLimiter::for('login', fn (Request $request): array => [
            Limit::perMinute(5)->by(Str::lower(trim((string) $request->input('email'))).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);

        RateLimiter::for('public-booking', fn (Request $request): array => [
            Limit::perMinute(10)->by('ip|'.$request->ip()),
            Limit::perHour(5)->by('email|'.Str::lower(trim((string) $request->input('contact_email')))),
        ]);

        ResetPassword::createUrlUsing(fn (User $user, string $token): string => url(
            '/app/reset-password?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()),
        ));
    }
}
