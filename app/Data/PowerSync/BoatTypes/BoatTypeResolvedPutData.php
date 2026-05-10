<?php

namespace App\Data\PowerSync\BoatTypes;

use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync boat_types PUT before persistence.
 */
final class BoatTypeResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public string $name,
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

    public static function fromPut(BoatTypePutData $dto): self
    {
        $name = $dto->name;
        $resolvedName = ($name !== null && $name !== '') ? $name : 'Untitled';

        $key = $dto->banner_object_key;
        $keyNormalized = is_string($key) && $key !== '' ? $key : null;

        if ($keyNormalized === null) {
            return self::validateAndCreate([
                'program_id' => $dto->program_id,
                'name' => $resolvedName,
                'banner_object_key' => null,
                'banner_mime_type' => null,
                'banner_size_bytes' => null,
                'banner_etag' => null,
                'banner_uploaded_at' => null,
            ]);
        }

        return self::validateAndCreate([
            'program_id' => $dto->program_id,
            'name' => $resolvedName,
            'banner_object_key' => $keyNormalized,
            'banner_mime_type' => $dto->banner_mime_type,
            'banner_size_bytes' => $dto->banner_size_bytes,
            'banner_etag' => $dto->banner_etag,
            'banner_uploaded_at' => $dto->banner_uploaded_at,
        ]);
    }
}
