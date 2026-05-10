<?php

namespace App\Data\PowerSync\BoatTypes;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;

/**
 * Validated payload for PowerSync boat_types PUT (inner {@code data} object).
 */
final class BoatTypePutData extends Data
{
    public function __construct(
        public string $program_id,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $name = null,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $banner_object_key = null,
        public ?string $banner_mime_type = null,
        public ?int $banner_size_bytes = null,
        public ?string $banner_etag = null,
        public ?string $banner_uploaded_at = null,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'banner_object_key' => [
                'nullable',
                'string',
                'max:1024',
                ImageUpload::objectKeyValidationRule(),
            ],
            'banner_mime_type' => ['nullable', 'string', Rule::in(ImageUpload::ALLOWED_MIME_TYPES)],
            'banner_size_bytes' => ['nullable', 'integer', 'min:1', 'max:12582912'],
            'banner_etag' => ['nullable', 'string', 'max:128'],
            'banner_uploaded_at' => ['nullable', 'string', 'max:64'],
        ];
    }
}
