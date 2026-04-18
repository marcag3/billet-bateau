<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Notifications\SendInvoice as NotificationsSendInvoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendInvoice implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function uniqueId()
    {
        return $this->invoice->id;
    }

    public function handle()
    {
        $this->invoice->client->notify(new NotificationsSendInvoice($this->invoice));
    }
}
