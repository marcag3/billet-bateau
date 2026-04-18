<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
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
            'id' =>$this->id,
            'name'=>$this->name,
            'address' => $this->address,
            'apartment' => $this->apartment,
            'city' => $this->city,
            'postalCode' => $this->postalCode,
            'telephone' => $this->telephone,
            'email' => $this->email,
        ];
    }
}
