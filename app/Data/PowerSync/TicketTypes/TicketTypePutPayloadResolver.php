<?php

namespace App\Data\PowerSync\TicketTypes;

use App\Models\TicketType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;

/**
 * Merges PowerSync ticket_types PUT payloads with an optional existing row.
 *
 * @return array{
 *     program_id: string,
 *     title: string,
 *     price_cents: int|null,
 *     is_pay_what_you_can: bool,
 *     min_per_purchase: int,
 *     max_per_purchase: int|null,
 *     trip_inventory_caps: array<string, int|null>
 * }
 */
final class TicketTypePutPayloadResolver
{
    /**
     * @return array{
     *     program_id: string,
     *     title: string,
     *     price_cents: int|null,
     *     is_pay_what_you_can: bool,
     *     min_per_purchase: int,
     *     max_per_purchase: int|null,
     *     trip_inventory_caps: array<string, int|null>
     * }
     */
    public static function resolve(TicketTypePutData $dto, ?TicketType $existing): array
    {
        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if (! ($dto->program_id instanceof Optional) && $dto->program_id !== null && $dto->program_id !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            if ($dto->program_id instanceof Optional || $dto->program_id === null || $dto->program_id === '') {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }

            $programId = $dto->program_id;
        }

        $title = $dto->title instanceof Optional ? ($existing?->title ?? null) : $dto->title;
        if ($title === null || $title === '') {
            throw ValidationException::withMessages([
                'data.title' => 'Title is required.',
            ]);
        }

        $priceCents = $dto->price_cents instanceof Optional ? $existing?->price_cents : $dto->price_cents;
        $isPayWhatYouCan = $dto->is_pay_what_you_can instanceof Optional
            ? (bool) ($existing?->is_pay_what_you_can ?? false)
            : (bool) $dto->is_pay_what_you_can;
        $minPerPurchase = $dto->min_per_purchase instanceof Optional ? ($existing?->min_per_purchase ?? 0) : $dto->min_per_purchase;
        $maxPerPurchase = $dto->max_per_purchase instanceof Optional ? $existing?->max_per_purchase : $dto->max_per_purchase;
        $tripInventoryCaps = $dto->trip_inventory_caps instanceof Optional
            ? (is_array($existing?->trip_inventory_caps) ? $existing->trip_inventory_caps : [])
            : self::normalizeTripInventoryCaps($dto->trip_inventory_caps);

        if ($minPerPurchase === null) {
            $minPerPurchase = 0;
        }

        return [
            'program_id' => $programId,
            'title' => $title,
            'price_cents' => $priceCents,
            'is_pay_what_you_can' => $isPayWhatYouCan,
            'min_per_purchase' => (int) $minPerPurchase,
            'max_per_purchase' => $maxPerPurchase,
            'trip_inventory_caps' => $tripInventoryCaps,
        ];
    }

    /**
     * @param  array<string, mixed>|string|null  $rawCaps
     * @return array<string, int|null>
     */
    private static function normalizeTripInventoryCaps(array|string|null $rawCaps): array
    {
        if ($rawCaps === null) {
            return [];
        }

        if (is_string($rawCaps)) {
            if ($rawCaps === '') {
                return [];
            }

            $decoded = json_decode($rawCaps, true);
            if (! is_array($decoded)) {
                throw ValidationException::withMessages([
                    'data.trip_inventory_caps' => 'Trip inventory caps must be a valid JSON object.',
                ]);
            }

            $rawCaps = $decoded;
        }

        $caps = [];
        foreach ($rawCaps as $tripId => $cap) {
            $tripIdString = (string) $tripId;
            if ($tripIdString === '') {
                continue;
            }

            if ($cap === null) {
                $caps[$tripIdString] = null;

                continue;
            }

            if (! is_numeric($cap) || (int) $cap < 0) {
                throw ValidationException::withMessages([
                    'data.trip_inventory_caps' => 'Each trip inventory cap must be a non-negative integer or null.',
                ]);
            }

            $caps[$tripIdString] = (int) $cap;
        }

        return $caps;
    }
}
