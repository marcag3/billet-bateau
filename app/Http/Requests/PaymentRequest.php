<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PaymentRequest extends FormRequest
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
            'method'=>Rule::in(collect(config('enums.payment_method'))->keys()),
            'payment_date'=>'date',
            'note'=>'nullable|max:255',
            'invoice_payments'=>'array',
            'invoice_payments.*'=>'array',
            'invoice_payments.*.invoice_id'=>'required|exists:invoices,id',
            'invoice_payments.*.amount'=>'required|numeric',
        ];
    }
}
