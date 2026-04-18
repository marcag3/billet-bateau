<?php

namespace App\Providers;

use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;
use Square\Environment;
use Square\SquareClient;

class SquareServiceProvider extends ServiceProvider implements DeferrableProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(SquareClient::class, function () {
            return new SquareClient([
                'accessToken' => config('services.square.accesToken'),
                'environment' => config('app.env') === 'production' ? Environment::PRODUCTION : Environment::SANDBOX,
            ]);
        });
    }

    public function provides()
    {
        return [SquareClient::class];
    }
}
