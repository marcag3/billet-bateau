<?php

namespace App\Data\PowerSync\TemplateDaySlots;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync template_day_slots PUT before persistence.
 */
final class TemplateDaySlotResolvedPutData extends Data
{
    /**
     * @param  array<string, mixed>|null  $ticket_setup
     */
    public function __construct(
        public int $sort_order,
        public string $departure_time,
        public int $capacity,
        public ?string $boat_type_id,
        public ?string $water_route_id,
        public ?string $internal_notes,
        public ?array $ticket_setup,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum|Closure>>
     */
    public static function rules(): array
    {
        return [
            'sort_order' => ['required', 'integer', 'min:0'],
            'departure_time' => ['required', 'string', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/'],
            'capacity' => ['required', 'integer', 'min:1'],
            'boat_type_id' => ['nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['nullable', 'ulid', 'exists:water_routes,id'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'ticket_setup' => [
                'nullable',
                'array',
                static function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value === null || ! is_array($value)) {
                        return;
                    }

                    foreach (self::ticketSetupErrors($value) as $message) {
                        $fail($message);
                    }
                },
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $ticketSetup
     * @return list<string>
     */
    private static function ticketSetupErrors(array $ticketSetup): array
    {
        $errors = [];

        if (! array_key_exists('policy', $ticketSetup) || ! in_array($ticketSetup['policy'] ?? null, ['defaults', 'custom'], true)) {
            $errors[] = 'ticket_setup.policy must be "defaults" or "custom".';
        }

        if (($ticketSetup['policy'] ?? null) === 'custom') {
            if (empty($ticketSetup['allowed_ticket_type_ids']) || ! is_array($ticketSetup['allowed_ticket_type_ids'])) {
                $errors[] = 'ticket_setup.allowed_ticket_type_ids is required when policy is "custom".';
            }
        }

        if (array_key_exists('min_per_booking', $ticketSetup)) {
            $min = $ticketSetup['min_per_booking'];
            if (! is_int($min) || $min < 0) {
                $errors[] = 'ticket_setup.min_per_booking must be a non-negative integer.';
            }
        }

        if (array_key_exists('max_per_booking', $ticketSetup)) {
            $max = $ticketSetup['max_per_booking'];
            if (! is_int($max) || $max < 0) {
                $errors[] = 'ticket_setup.max_per_booking must be a non-negative integer.';
            }
        }

        return $errors;
    }
}
