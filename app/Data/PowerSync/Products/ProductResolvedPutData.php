<?php

namespace App\Data\PowerSync\Products;

use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync products PUT before persistence.
 */
final class ProductResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public string $name,
        public ?string $description,
        public int $capacity,
        public ?string $boat_type_id,
        public ?string $water_route_id,
        public ?string $banner_object_key,
        public ?string $banner_mime_type,
        public ?int $banner_size_bytes,
        public ?string $banner_etag,
        public ?string $banner_uploaded_at,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:65535'],
            'capacity' => ['required', 'integer', 'min:1'],
            'boat_type_id' => ['nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['nullable', 'ulid', 'exists:water_routes,id'],
            'banner_object_key' => [
                'nullable',
                'string',
                'max:1024',
                ImageUpload::objectKeyValidationRule(),
            ],
            'banner_mime_type' => [
                'nullable',
                'string',
                Rule::in(ImageUpload::ALLOWED_MIME_TYPES),
                'required_with:banner_object_key',
            ],
            'banner_size_bytes' => ['nullable', 'integer', 'min:1', 'max:12582912', 'required_with:banner_object_key'],
            'banner_etag' => ['nullable', 'string', 'max:128'],
            'banner_uploaded_at' => ['nullable', 'string', 'max:64', 'required_with:banner_object_key'],
        ];
    }
}
