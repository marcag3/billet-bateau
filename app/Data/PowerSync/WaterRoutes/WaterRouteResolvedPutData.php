<?php

namespace App\Data\PowerSync\WaterRoutes;

use Clickbar\Magellan\Data\Geometries\LineString;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync water_routes PUT before persistence.
 */
final class WaterRouteResolvedPutData extends Data
{
    public function __construct(
        public string $name,
        public int $duration_minutes,
        public LineString $trace,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'trace' => ['required'],
        ];
    }
}
