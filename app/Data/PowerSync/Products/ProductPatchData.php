<?php

namespace App\Data\PowerSync\Products;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync products PATCH (inner {@code data} object).
 */
final class ProductPatchData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public string|Optional|null $description = new Optional,
        public int|Optional|null $capacity = new Optional,
        public string|Optional|null $boat_type_id = new Optional,
        public string|Optional|null $water_route_id = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $banner_object_key = new Optional,
        public string|Optional|null $banner_mime_type = new Optional,
        public int|Optional|null $banner_size_bytes = new Optional,
        public string|Optional|null $banner_etag = new Optional,
        public string|Optional|null $banner_uploaded_at = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid', 'exists:programs,id'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:65535'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'boat_type_id' => ['sometimes', 'nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['sometimes', 'nullable', 'ulid', 'exists:water_routes,id'],
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
