<?php

namespace App\Data\PowerSync\WaterRoutes;

use App\Data\PowerSync\Casts\GeoJsonLineStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use App\Rules\GeoJsonLineStringRule;
use Clickbar\Magellan\Data\Geometries\LineString;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync water_routes PATCH (inner {@code data} object).
 */
final class WaterRoutePatchData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public int|Optional|null $duration_minutes = new Optional,
        #[WithCast(GeoJsonLineStringCast::class)]
        public LineString|Optional|null $trace = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'trace' => ['sometimes', 'required', 'string', new GeoJsonLineStringRule],
        ];
    }
}
