<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SailingPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'departure'=>'date|required',
            'planned_duration'=>'integer|min:0',
            'arrival'=>'date|nullable|after:departure',
            'status'=> [Rule::in(collect(config('enums.sailing_plan_status'))->keys()), 'required'],
            'clients'=>'nullable',
            'clients.*'=>'exists:clients,id',
            'tickets'=>'nullable',
            'tickets.*'=>'exists:tickets,id',
            'boat_category_id' => 'exists:boat_categories,id',
            'number_of_passengers' => 'integer',
            'number_of_teens'=>'integer|lte:number_of_passengers',
            'number_of_children'=>'integer|lte:number_of_passengers',
            'guide_id'=>'exists:users,id|nullable',
            'route_id'=>'exists:routes,id|required',
            'trip_id' => 'exists:trips,id|nullable',
            'boat_charge'=>'integer|min:0|max:100|nullable',
            'note'=>'string|nullable',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $validated = $validator->validated();

            if ($validated['number_of_passengers'] < $validated['number_of_teens'] + $validated['number_of_children']) {
                $validator->errors()->add('number_of_passengers', __('Number of passengers must be greater than number of teens and children'));
            }
        });
    }
}
