<?php

namespace App\Data\PowerSync\Guides;

use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class GuidePutData extends Data
{
    public function __construct(
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public string|Optional|null $staff_user_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'staff_user_id' => ['sometimes', 'nullable', 'ulid', 'exists:users,id'],
        ];
    }
}
