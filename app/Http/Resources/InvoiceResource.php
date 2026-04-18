<?php

namespace App\Http\Resources;

use App\Http\Resources\InvoiceItemResource;
use App\Http\Resources\InvoicePaymentResource;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class InvoiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $this->loadMissing('invoiceItems', 'invoicePayments');

        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'clientName'=>$this->client->fullName,
            $this->mergeWhen(Auth::guard('user')->check(), [
                'user_id' => $this->user_id,
            ]),
            'invoice_date' => $this->invoice_date->toDateTimeString(),
            'taxable_subtotal' => $this->taxable_subtotal,
            'non_taxable_subtotal' => $this->non_taxable_subtotal,
            'tps' => $this->tps,
            'tvq' => $this->tvq,
            'total' => $this->total,
            'status' => $this->status,
            'sent_at' => $this->sent_at ? $this->sent_at->toDateTimeString() : null,
            'due_amount' => $this->due_amount,
            'invoice_items' => InvoiceItemResource::collection($this->invoiceItems),
            'invoice_payments' => InvoicePaymentResource::collection($this->invoicePayments),
            'point_of_sale_id' => $this->point_of_sale_id,
        ];
    }
}
