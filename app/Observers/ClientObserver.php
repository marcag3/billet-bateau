<?php

namespace App\Observers;

use App\Models\Client;
use App\Events\ClientFormFilled;
use App\Models\Invoice;

class ClientObserver
{
    public function updated(Client $client)
    {
        ClientFormFilled::dispatch($client);
    }

    public function deleted(Client $client)
    {
        $invoices = Invoice::destroy(
            $client->invoices->pluck('id')
        );

        if ($invoices >= 1) {
            flash('Factures du client supprimées')->info();
        }
    }
}
