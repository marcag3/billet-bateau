<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
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
            'invoice_id'=>$this->invoice_id,
            'itemable_id'=>$this->itemable_id,
            'itemable_type'=>$this->itemable_type,
            'price'=>$this->price,
            'is_taxable'=>$this->is_taxable,
            'number_of_items'=>$this->number_of_items,
        ];
    }
}
