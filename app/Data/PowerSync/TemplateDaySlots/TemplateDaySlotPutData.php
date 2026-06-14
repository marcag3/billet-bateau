<?php

namespace App\Data\PowerSync\TemplateDaySlots;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class TemplateDaySlotPutData extends Data
{
    public function __construct(
        public string|Optional|null $template_day_id = new Optional,
        public int|Optional|null $sort_order = new Optional,
        public string|Optional|null $departure_time = new Optional,
        public int|Optional|null $capacity = new Optional,
        public string|Optional|null $boat_type_id = new Optional,
        public string|Optional|null $water_route_id = new Optional,
        public string|Optional|null $internal_notes = new Optional,
        public string|array|Optional|null $ticket_setup = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'template_day_id' => ['sometimes', 'nullable', 'ulid', 'exists:template_days,id'],
            'sort_order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'departure_time' => ['sometimes', 'nullable', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$/'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'boat_type_id' => ['sometimes', 'nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['sometimes', 'nullable', 'ulid', 'exists:water_routes,id'],
            'internal_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'ticket_setup' => ['sometimes', 'nullable'],
        ];
    }
}
