<?php

namespace App\Http\Requests;

use App\Models\ProgramInvitation;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $userId = $this->user()?->getAuthIdentifier();

        return [
            'current_password' => ['nullable', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
                function (string $attribute, mixed $value, Closure $fail): void {
                    $normalizedEmail = Str::lower(trim((string) $value));
                    $currentEmail = Str::lower(trim((string) ($this->user()->email ?? '')));

                    if ($normalizedEmail === $currentEmail) {
                        return;
                    }

                    if (ProgramInvitation::hasPendingInvitationForEmail($normalizedEmail)) {
                        $fail(__('This email address has a pending program invitation.'));
                    }
                },
            ],
        ];
    }

    /**
     * Changing the sign-in email requires the current password, so a hijacked session
     * cannot move the account to an attacker's address.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty() || ! $this->changesEmail()) {
                    return;
                }

                $user = $this->user();

                if ($user === null || ! Hash::check($this->string('current_password')->toString(), $user->password)) {
                    $validator->errors()->add('current_password', __('The provided password is incorrect.'));
                }
            },
        ];
    }

    private function changesEmail(): bool
    {
        $normalizedEmail = Str::lower(trim($this->string('email')->toString()));
        $currentEmail = Str::lower(trim((string) ($this->user()->email ?? '')));

        return $normalizedEmail !== $currentEmail;
    }
}
