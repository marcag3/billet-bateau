<?php

namespace App\Providers;

use App\Models\Activity;
use App\Models\BoatInventory;
use App\Models\Calendar;
use App\Models\CalendarDate;
use App\Models\Client;
use App\Models\PointOfSale;
use App\Policies\PointOfSalePolicy;
use App\Policies\RolePolicy;
use App\Policies\SchedulePolicy;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\Stop;
use App\Models\Trip;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Session;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [

        Role::class => RolePolicy::class,
        Calendar::class => SchedulePolicy::class,
        CalendarDate::class => SchedulePolicy::class,
        Route::class => SchedulePolicy::class,
        RouteStop::class => SchedulePolicy::class,
        Stop::class => SchedulePolicy::class,
        Trip::class => SchedulePolicy::class,
        BoatInventory::class => SchedulePolicy::class,
        Activity::class => SchedulePolicy::class,
        PointOfSale::class=>PointOfSalePolicy::class,
        Area::class=>PointOfSalePolicy::class,

    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Implicitly grant "Super Admin" role all permissions
        // This works in the app by using gate-related functions like auth()->user->can() and @can()
        Gate::before(function ($user, $ability) {
            return $user->hasRole('Chancelier Suprême') ? true : null;
        });
    }
}
