<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SailingPlanResource extends JsonResource
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
            'departure' => $this->departure->toDateTimeString(),
            'planned_duration' => $this->planned_duration,
            'arrival' => $this->arrival ? $this->arrival->toDateTimeString() : null,
            'status' => $this->status,
            'guide_id' => $this->guide_id,
            'trip_id' => $this->trip_id,
            'boat_category_id' => $this->boat_category_id,
            'route_id' => $this->route_id,
            'number_of_passengers' => $this->number_of_passengers ?? 0,
            'number_of_teens' => $this->number_of_teens ?? 0,
            'number_of_children' => $this->number_of_children ?? 0,
            'boat_charge' => $this->boat_charge,
            'note' => $this->note,
            'boardings'=>BoardingResource::collection($this->boardings),
        ];
    }
}
