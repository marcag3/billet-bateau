<?php

namespace App\Providers;

use App\Services\PowerSyncTokenIssuer;
use Illuminate\Database\Eloquent\Model;
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
        Model::shouldBeStrict(! $this->app->isProduction());

        if ($this->app->runningInConsole()) {
            $this->app->make(ActionManager::class)->registerCommands();
        }
    }
}
