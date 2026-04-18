<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ClientRequest extends FormRequest
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
        $rules = [
            'firstName' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'apartment' => 'nullable|max:255',
            'city' => 'nullable|string|max:255',
            'postalCode' => ['nullable',
                'regex:/^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] [0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]/', ],
            'homephone' => ['nullable', 'regex:/^\+1 ([2-9][0-8][0-9])-([2-9][0-9]{2})-([0-9]{4})( x[0-9]+)?$/'],
            'cellphone' => ['nullable', 'regex:/^\+1 ([2-9][0-8][0-9])-([2-9][0-9]{2})-([0-9]{4})( x[0-9]+)?$/'],
            'birthday' => 'nullable|date',
            'emergencyContact' => 'nullable|string|max:255',
            'emergencyPhone' => ['nullable', 'regex:/^\+1 ([2-9][0-8][0-9])-([2-9][0-9]{2})-([0-9]{4})( x[0-9]+)?$/'],
            'identification_card_number'=>'requiredIf:wants_to_rent,true|requiredWith:identification_card_type|nullable|string|max:100',
            'identification_card_type'=>'requiredIf:wants_to_rent,true|requiredWith:identification_card_number|nullable|integer|max:2|min:0',
            'note' => 'nullable|max:1000',
        ];
        if (Auth::guard('user')->check()) {
            $rules = $rules + [
                'email' => 'email|nullable',
                'initiation_sailing_plan_id'=>'nullable|exists:sailing_plans,id',
            ];
        }

        return $rules;
    }
}
