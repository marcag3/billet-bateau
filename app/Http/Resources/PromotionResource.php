<?php

namespace App\Http\Resources;

use App\Models\PointOfSale;
use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return parent::toArray($request) + ['available_points_of_sale_ids'=>PointOfSale::all()->pluck('id')];
    }
}
