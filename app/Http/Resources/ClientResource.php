<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class ClientResource extends JsonResource
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
            'email'=>$this->email,
            'firstName' => $this->firstName,
            'name' => $this->name,
            'address' => $this->address,
            'apartment' => $this->apartment,
            'city' => $this->city,
            'postalCode' => $this->postalCode,
            'homephone' => $this->homephone,
            'cellphone' => $this->cellphone,
            'birthday' => $this->birthday,
            'emergencyContact' => $this->emergencyContact,
            'emergencyPhone' => $this->emergencyPhone,
            'note' => $this->note,
            'is_guided' => $this->is_guided,
            'products_ids' => $this->products->pluck('id'),
            'subscriptions_ids' => $this->subscriptions->pluck('id'),
            'is_member' => $this->is_member,
            'promotions_ids' => $this->promotions->pluck('id'),
            'wants_to_rent' => $this->wants_to_rent,
            'is_profile_complete' => $this->is_profile_complete,
            'has_unconfirmed_booking' => $this->has_unconfirmed_booking,
            'has_product_without_booking' => $this->has_product_without_booking,
            'identification_card_number' => $this->identification_card_number,
            'identification_card_type' => $this->identification_card_type,
            $this->mergeWhen(Auth::guard('user')->check(), [
                'initiation_sailing_plan_id' => $this->initiation_sailing_plan_id,
            ]),
            'active_invoice_id'=>$this->active_invoice_id,
        ];
    }
}
