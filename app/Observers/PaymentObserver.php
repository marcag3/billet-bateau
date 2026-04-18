<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Models\Payment;

class PaymentObserver
{
    public function saved(Payment $payment)
    {
        $payment->invoices->each(function ($invoice) {
            if ($invoice->status === Invoice::DRAFT && $invoice->due_amount === '0.00') {
                $invoice->status = Invoice::CONFIRMED;
                $invoice->save();
            }
        });
    }

    public function deleted(Payment $payment)
    {
        $payment->invoicePayments->each(function ($invoicePayment) {
            $invoicePayment->delete();
        });
    }
}
