<?php

namespace App\Http\Requests;

use App\Models\ProgramInvitation;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
                function (string $attribute, mixed $value, Closure $fail): void {
                    $normalizedEmail = Str::lower(trim((string) $value));
                    $currentEmail = Str::lower(trim((string) ($this->user()?->email ?? '')));

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
}
