<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as Authenticatable;

class InvoicePolicy
{
    use HandlesAuthorization;

    public function viewAny(Authenticatable $user, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view invoices');
    }

    public function view(Authenticatable $user, Invoice $invoice, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view invoices');
    }

    public function create(Authenticatable $user, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('edit invoices');
    }

    public function update(Authenticatable $user, Invoice $invoice, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client) && $invoice->isDraft) {
                return true;
            }

            return false;
        }

        return $user->can('edit invoices');
    }

    public function delete(Authenticatable $user, Invoice $invoice, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client) && $invoice->isDraft) {
                return true;
            }

            return false;
        }

        return $user->can('delete invoices');
    }
}
