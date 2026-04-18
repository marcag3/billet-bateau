<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceItem extends Model
{
    use softDeletes;

    public $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'is_taxable'=>'boolean',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function invoice()
    {
        return $this->belongsTo(\App\Models\Invoice::class);
    }

    public function itemable()
    { //Product, subscription and Promotion
        return $this->morphTo();
    }

    public function pass()
    {
        return $this->hasOne(\App\Models\Pass::class);
    }

    public function coupon()
    {
        return $this->hasOne(\App\Models\Coupon::class);
    }

    public function ticket()
    {
        return $this->hasOne(\App\Models\Ticket::class);
    }
}
