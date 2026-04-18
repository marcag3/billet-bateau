<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use softDeletes;

    protected $guarded = [];

    protected $casts = [
        'payment_date' => 'datetime',
    ];

    protected $touches = ['invoices'];

    public const CASH = 1;

    public const CARD = 2;

    public const INTERNET = 3;

    public const SQUARE = 4;

    public function invoicePayments()
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function invoices()
    {
        return $this->belongsToMany(Invoice::class, 'invoice_payment');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class)->withDefault();
    }

    public function getTotalAttribute()
    {
        return $this->invoicePayments->reduce(function ($sum, $invoicePayment) {
            return bcadd($sum, $invoicePayment->amount, 2);
        }, '0.00');
    }

    public function syncInvoicePayments(array $invoicePayments)
    {
        $toSync = [];
        foreach ($invoicePayments as $invoicePayment) {
            $toSync[$invoicePayment['invoice_id']] = ['amount'=>$invoicePayment['amount']];
        }
        $this->invoices()->sync($toSync);
        $this->refresh(); //to update the newly created invoice payments
    }
}
