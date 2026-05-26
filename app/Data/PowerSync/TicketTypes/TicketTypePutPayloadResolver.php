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
 *     depends_on_ticket_type_id: string|null,
 *     max_per_reference_ticket: int|null
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
     *     max_per_purchase: int|null
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
        $dependsOnTicketTypeId = $dto->depends_on_ticket_type_id instanceof Optional
            ? $existing?->depends_on_ticket_type_id
            : $dto->depends_on_ticket_type_id;
        $maxPerReferenceTicket = $dto->max_per_reference_ticket instanceof Optional
            ? $existing?->max_per_reference_ticket
            : $dto->max_per_reference_ticket;

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
            'depends_on_ticket_type_id' => $dependsOnTicketTypeId !== null && $dependsOnTicketTypeId !== ''
                ? (string) $dependsOnTicketTypeId
                : null,
            'max_per_reference_ticket' => $maxPerReferenceTicket !== null ? (int) $maxPerReferenceTicket : null,
        ];
    }
}
