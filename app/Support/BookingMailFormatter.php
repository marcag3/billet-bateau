<?php

namespace App\Support;

use App\Models\Booking;
use Illuminate\Support\Collection;

final class BookingMailFormatter
{
    public static function formatTicketSummary(Booking $booking): string
    {
        /** @var Collection<int, string> $lines */
        $lines = $booking->bookingTickets
            ->groupBy(static fn ($ticket): string => (string) $ticket->ticket_type_id)
            ->map(function (Collection $group): string {
                $title = $group->first()?->ticketType?->title ?? __('Billet');

                return __(':count × :title', [
                    'count' => $group->count(),
                    'title' => $title,
                ]);
            })
            ->values();

        if ($lines->isEmpty()) {
            return (string) $booking->bookingTickets->count();
        }

        return $lines->implode(', ');
    }

    public static function formatSalutation(?string $emailSignature): string
    {
        $closing = __('Cordialement,');
        $signature = trim((string) ($emailSignature ?? ''));

        if ($signature === '') {
            return $closing;
        }

        return $closing."\n\n".$signature;
    }
}
