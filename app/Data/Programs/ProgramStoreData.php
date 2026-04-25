<?php

namespace App\Data\Programs;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\File;
use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;

#[MergeValidationRules]
final class ProgramStoreData extends Data
{
    /**
     * @param  array<int, UploadedFile>|null  $images
     */
    public function __construct(
        public ?string $id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public string $slug,
        public ?AddressUpsertData $address,
        public ?array $images,
    ) {}

    /**
     * @return array<string, list<string|File>>
     */
    public static function rules(): array
    {
        return [
            'id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'theme_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'slug' => ['required', 'string', 'max:255', 'lowercase', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/u'],
            'address' => ['nullable', 'array'],
            'address.line_1' => ['nullable', 'string', 'max:255'],
            'address.line_2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:120'],
            'address.postal_code' => ['nullable', 'string', 'max:32'],
            'address.country' => ['nullable', 'string', 'max:120'],
            'images' => ['nullable', 'array', 'max:12'],
            'images.*' => ['file', 'image', 'max:12288'],
        ];
    }
}
