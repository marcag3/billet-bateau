<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
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
            'route_id' => $this->route_id,
            'service_id' => $this->service_id,
            'boat_category_id' => $this->boat_category_id,
            'start_time' => $this->start_time->format('h:i'),
            'guided' => $this->guided,
            'boat_inventory_id' => $this->boat_inventory_id,
        ];
    }
}
