<?php

namespace App\Listeners;

use App\Models\Invoice;
use App\Notifications\SendInvoice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class MarkInvoiceSent
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  object  $event
     * @return void
     */
    public function handle($event)
    {
        if ($event->notification::class === SendInvoice::class) {
            $event->notification->invoice->sent_at = now();
            $event->notification->invoice->saveQuietly();
        }
    }
}
