<?php

namespace App\Providers;

use App\Services\PowerSyncTokenIssuer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;
use Lorisleiva\Actions\ActionManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PowerSyncTokenIssuer::class, fn (): PowerSyncTokenIssuer => PowerSyncTokenIssuer::fromConfig());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Date::use(CarbonImmutable::class);

        Model::shouldBeStrict(! $this->app->isProduction());

        if ($this->app->runningInConsole()) {
            $this->app->make(ActionManager::class)->registerCommands();
        }
    }
}
