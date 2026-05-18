<?php

namespace App\Data\PowerSync\Programs;

use App\Data\PowerSync\Casts\LooseBooleanCast;
use App\Data\PowerSync\Casts\SlugInputCast;
use App\Data\PowerSync\Casts\ThemeColorCast;
use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use App\Support\Media\ImageUpload;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Validated payload for PowerSync programs PUT (inner {@code data} object).
 *
 * Omitted keys remain {@see Optional} so PUT can merge with an existing row.
 */
final class ProgramPutData extends Data
{
    public function __construct(
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public string|Optional|null $description = new Optional,
        #[WithCast(ThemeColorCast::class)]
        public string|Optional|null $theme_color = new Optional,
        #[WithCast(LooseBooleanCast::class)]
        public bool|int|string|Optional|null $is_active = new Optional,
        #[WithCast(LooseBooleanCast::class)]
        public bool|int|string|Optional|null $is_archived = new Optional,
        #[WithCast(SlugInputCast::class)]
        public string|Optional|null $slug = new Optional,
        public string|Optional|null $start_date = new Optional,
        public string|Optional|null $end_date = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $line_1 = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $line_2 = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $city = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $postal_code = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $country = new Optional,
        /** @var list<string>|string|Optional|null */
        public array|string|Optional|null $booking_questions = new Optional,
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
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'theme_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
            'is_archived' => ['sometimes', 'nullable', 'boolean'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'start_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'line_1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'line_2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'country' => ['sometimes', 'nullable', 'string', 'max:120'],
            'booking_questions' => ['sometimes'],
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
