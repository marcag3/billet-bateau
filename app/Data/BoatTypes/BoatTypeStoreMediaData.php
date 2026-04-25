<?php

namespace App\Data\BoatTypes;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Data;

#[MergeValidationRules]
final class BoatTypeStoreMediaData extends Data
{
    /**
     * @param  array<int, UploadedFile>  $images
     */
    public function __construct(
        public array $images,
    ) {}

    /**
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:12'],
            'images.*' => ['file', 'image', 'max:12288'],
        ];
    }
}
