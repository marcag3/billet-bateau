<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {

//        if ($this->app->isLocal()) {
        //    $this->app->register(TelescopeServiceProvider::class);
//        }
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //Fix for SwiftMailer Service
        $_SERVER['SERVER_NAME'] = config('app.url');

        if (request()->cookie('language_preference') !== null) {
            App::setLocale(request()->cookie('language_preference'));
        }

        URL::forceRootUrl(config('app.url'));
        // if(request()->hasHeader('x-forwarded-proto') && request()->header('x-forwarded-proto') === "https")
        // {

        // }

        Relation::enforceMorphMap([
            'Ticket' => \App\Models\Ticket::class,
            'Pass' => \App\Models\Pass::class,
            'App\User' => \App\Models\User::class,
            'App\Client' => \App\Models\Client::class,
            'App\Product' => \App\Models\Product::class,
            'App\Subscription' => \App\Models\Subscription::class,
            'App\Promotion' => \App\Models\Promotion::class,
        ]);
    }
}
