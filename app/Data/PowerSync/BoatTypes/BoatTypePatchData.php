<?php

namespace App\Data\PowerSync\BoatTypes;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync boat_types PATCH (inner {@code data} object).
 */
final class BoatTypePatchData extends Data
{
    public function __construct(
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional $name = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $banner_object_key = new Optional,
        public string|Optional|null $banner_mime_type = new Optional,
        public int|Optional|null $banner_size_bytes = new Optional,
        public string|Optional|null $banner_etag = new Optional,
        public string|Optional|null $banner_uploaded_at = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'banner_object_key' => [
                'sometimes',
                'nullable',
                'string',
                'max:1024',
                ImageUpload::objectKeyValidationRule(),
            ],
            'banner_mime_type' => ['sometimes', 'nullable', 'string', Rule::in(ImageUpload::ALLOWED_MIME_TYPES)],
            'banner_size_bytes' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:12582912'],
            'banner_etag' => ['sometimes', 'nullable', 'string', 'max:128'],
            'banner_uploaded_at' => ['sometimes', 'nullable', 'string', 'max:64'],
        ];
    }
}
