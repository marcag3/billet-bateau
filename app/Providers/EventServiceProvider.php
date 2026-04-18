<?php

namespace App\Providers;

use App\Models\BoatInventory;
use App\Models\Booking;
use App\Models\Client;
use App\Events\BookingSaving;
use App\Events\ClientFormFilled;
use App\Events\ClientLogin;
use App\Events\ClientRegisted;
use App\Events\InvoiceConfirmed;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Listeners\ConfirmBooking;
use App\Listeners\MarkInvoiceSent;
use App\Listeners\RequirePassPhrase;
use App\Observers\BoatInventoryObserver;
use App\Observers\BookingObserver;
use App\Observers\ClientObserver;
use App\Observers\InvoiceItemObserver;
use App\Observers\InvoiceObserver;
use App\Observers\PassObserver;
use App\Observers\PaymentObserver;
use App\Observers\SailingPlanObserver;
use App\Models\Pass;
use App\Models\Payment;
use App\Models\SailingPlan;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        ClientLogin::class => [
            RequirePassPhrase::class,
        ],
        ClientRegisted::class => [
            RequirePassPhrase::class,
        ],
        ClientFormFilled::class => [
            ConfirmBooking::class,
        ],
        InvoiceConfirmed::class => [
            ConfirmBooking::class,
        ],
        BookingSaving::class => [
            ConfirmBooking::class,
        ],
        'Illuminate\Notifications\Events\NotificationSent' => [
            MarkInvoiceSent::class,
        ],

    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();
        Client::observe(ClientObserver::class);
        Booking::observe(BookingObserver::class);
        Pass::observe(PassObserver::class);
        Invoice::observe(InvoiceObserver::class);
        InvoiceItem::observe(InvoiceItemObserver::class);
        SailingPlan::observe(SailingPlanObserver::class);
        BoatInventory::observe(BoatInventoryObserver::class);
        Payment::observe(PaymentObserver::class);
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     *
     * @return bool
     */
    public function shouldDiscoverEvents()
    {
        return false;
    }
}
