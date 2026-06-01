<?php

namespace App\Providers;

use App\Services\PowerSyncTokenIssuer;
use App\Support\ObjectStorage\ObjectStorage;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
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
    }
}
