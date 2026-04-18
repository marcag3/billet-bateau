<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoicePayment extends Model
{
    use softdeletes;

    protected $table = 'invoice_payment';

    public $incrementing = true;

    protected $guarded = [];

    protected $appends = [
        'formatted_amount',
        'payment_method_formatted',
        'payment_date_formatted',

    ];

    protected $cast = [
        'amount' => 'decimal:2',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    //GETTERS

    public function getInvoiceQualifierAttribute()
    {
        return $this->invoiceTrashed->full_qualifier;
    }

    public function getFormattedAmountAttribute()
    {
        return $this->amount.'$';
    }

    public function getPaymentMethodFormattedAttribute()
    {
        if ($this->payment) {
            return config('enums.payment_method.'.$this->payment->method);
        }
    }

    public function getPaymentDateFormattedAttribute()
    {
        if ($this->payment) {
            return $this->payment->payment_date->isoformat('ll');
        }
    }

    //RELATIONS

    public function payment()
    {
        return $this->belongsTo(\App\Models\Payment::class);
    }

    public function invoice()
    {
        return $this->belongsTo(\App\Models\Invoice::class);
    }

    public function invoiceTrashed()
    {
        return $this->belongsTo(\App\Models\Invoice::class, 'invoice_id')->withTrashed();
    }
}
