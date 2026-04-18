<?php

namespace App\Providers;

use App\Models\Boat;
use App\Models\BoatCategory;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\SailingPlan;
use App\Models\Subscription;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ViewServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        View::composer(['payments.create', 'payments.edit', 'invoices.show'], function ($view) {
            $invoices = Invoice::dueInvoices();

            $paymentsToDo = collect(session()->get('paymentsToDo'));

            return $view->with(compact('invoices', 'paymentsToDo'));
        });

        View::composer(['users.create', 'users.edit'], function ($view) {
            $clients = Client::all()->pluck('identifier', 'id');

            $roles = Role::pluck('name', 'id');

            return $view->with(compact('clients', 'roles'));
        });

        View::composer(['roles.create', 'roles.edit', 'roles.show'], function ($view) {
            $permissions = Permission::pluck('name', 'id');

            return $view->with(compact('permissions'));
        });
    }
}
