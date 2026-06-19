<?php

namespace App\Data\PowerSync\Programs;

use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Fully validated merged shape for PowerSync programs PUT before persistence.
 */
final class ProgramResolvedPutData extends Data
{
    public function __construct(
        public string $name,
        public ?string $description,
        public string $theme_color,
        public bool $is_active,
        public string $base_slug,
        public string $start_date,
        public string $end_date,
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
        public ?string $email_signature,
        public ?string $banner_object_key,
        public ?string $banner_mime_type,
        public ?int $banner_size_bytes,
        public ?string $banner_etag,
        public ?string $banner_uploaded_at,
        /** @var list<string> */
        public array $booking_questions = [],
    ) {}

    /**
     * @return array<string, list<string|ValidationRule>>
     */
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'theme_color' => ['required', 'string', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'is_active' => ['required', 'boolean'],
            'base_slug' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'line_1' => ['nullable', 'string', 'max:255'],
            'line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'max:120'],
            'email_signature' => ['nullable', 'string', 'max:1000'],
            'booking_questions' => ['sometimes', 'array', 'max:20'],
            'booking_questions.*' => ['string', 'min:1', 'max:255'],
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
