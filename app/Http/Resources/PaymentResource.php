<?php

namespace App\Http\Resources;

use App\Http\Resources\InvoicePaymentResource;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'id'=>$this->id,
            'method'=>$this->method,
            'payment_date'=>$this->payment_date->toDateTimeString(),
            'note'=>$this->note,
            'user_id'=>$this->user_id,
            'invoice_payments' => InvoicePaymentResource::collection($this->invoicePayments),
        ];
    }
}
