<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ClientLoginRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255', 'exists:clients,email', 'bail'],
            'passphrase' => ['required', 'string', 'max:255'],
            'expires' => ['nullable'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (! array_key_exists('email', $validator->validated())) {
                return;
            }
            $loginLink = DB::table('login_links')->where('email', $validator->validated()['email'])->first();
            if (! $loginLink) {
                $validator->errors()->add('passphrase', __('Pass phrase is already used'));

                return;
            }

            if ($loginLink->passphrase_expiry < now()->timestamp) {
                $validator->errors()->add('passphrase', __('Pass phrase is expired'));
            } elseif (! Hash::check($validator->validated()['passphrase'], $loginLink->passphrase)) {
                $validator->errors()->add('passphrase', __('Pass phrase is not valid'));
            }
        });
    }

    public function messages()
    {
        return [
            'email.exists' => __('email not in database'),

        ];
    }
}
