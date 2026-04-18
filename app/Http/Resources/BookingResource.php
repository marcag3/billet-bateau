<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class BookingResource extends JsonResource
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
            'id' => $this->id,
            'client_id' => $this->client_id,
            'user_id' => $this->when(Auth::guard('user')->check(), $this->user_id),
            'for_date' => $this->for_date->toDateString(),
            'trip_id' => $this->trip_id,
            'number_of_adults' => $this->number_of_adults,
            'number_of_teens' => $this->number_of_teens,
            'number_of_children' => $this->number_of_children,
            'number_of_boats' => $this->number_of_boats,
            'is_guided' => $this->is_guided,
            'confirmed_at' => $this->confirmed_at,
            'note' => $this->note,
            'is_full_boat' => $this->is_full_boat,
            'possible_products' => $this->when($this->confirmed_at === null, $this->possible_products),
            'possible_subscriptions' => $this->when($this->confirmed_at === null, $this->possible_subscriptions),
        ];
    }
}
