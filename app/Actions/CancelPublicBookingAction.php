<?php

namespace App\Actions;

use App\Data\Programs\PublicBookingCancelPreviewData;
use App\Models\Booking;
use App\Models\Trip;
use App\Notifications\BookingCancellationNotification;
use App\Support\AppLocale;
use App\Support\BookingMailFormatter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

final class CancelPublicBookingAction
{
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * @return array{valid: bool, reason?: string, data?: PublicBookingCancelPreviewData}
     */
    public function preview(string $token): array
    {
        $booking = $this->resolveBooking($token);

        if ($booking === null) {
            return [
                'valid' => false,
                'reason' => 'invalid',
            ];
        }

        $blockReason = $this->cancellationBlockReason($booking);
        if ($blockReason !== null) {
            return [
                'valid' => false,
                'reason' => $blockReason,
            ];
        }

        return [
            'valid' => true,
            'data' => $this->toPreviewData($booking),
        ];
    }

    /**
     * @throws ValidationException
     */
    public function cancel(string $token): PublicBookingCancelPreviewData
    {
        $booking = $this->resolveBooking($token);

        if ($booking === null) {
            throw ValidationException::withMessages([
                'token' => [__('This cancellation link is invalid.')],
            ]);
        }

        $blockReason = $this->cancellationBlockReason($booking);
        if ($blockReason !== null) {
            throw ValidationException::withMessages([
                'token' => [$this->blockReasonMessage($blockReason)],
            ]);
        }

        $preview = $this->toPreviewData($booking);
        $locale = AppLocale::normalize($booking->contact_locale);
        $contactEmail = $booking->contact_email;

        DB::transaction(static function () use ($booking): void {
            $booking->delete();
        });

        Notification::route('mail', $contactEmail)
            ->notify(new BookingCancellationNotification($booking, mailLocale: $locale));

        return $preview;
    }

    private function resolveBooking(string $token): ?Booking
    {
        if (strlen($token) !== 64 || preg_match('/^[A-Za-z0-9]{64}$/', $token) !== 1) {
            return null;
        }

        return Booking::query()
            ->where('cancel_token_hash', self::hashToken($token))
            ->with([
                'program:id,name,email_signature',
                'trip:id,scheduled_departure_at,product_id',
                'trip.product:id,name,description,banner_object_key,boat_type_id',
                'trip.product.boatType:id,banner_object_key',
                'trip.voyages:id,trip_id,status',
                'checkIn:id,booking_id',
                'bookingTickets.ticketType:id,title',
            ])
            ->first();
    }

    public function cancellationBlockReason(Booking $booking): ?string
    {
        $trip = $booking->trip;

        if ($trip === null || $trip->scheduled_departure_at->isPast()) {
            return 'past_departure';
        }

        if ($booking->checkIn !== null) {
            return 'checked_in';
        }

        $blockingStatuses = array_map(
            static fn ($status): string => $status->value,
            Trip::voyageStatusesBlockingPublicBooking(),
        );

        if ($trip->voyages->contains(
            static fn ($voyage): bool => in_array($voyage->status->value, $blockingStatuses, true),
        )) {
            return 'voyage_started';
        }

        return null;
    }

    private function blockReasonMessage(string $reason): string
    {
        return match ($reason) {
            'past_departure' => __('This booking can no longer be cancelled because the trip has already departed.'),
            'checked_in' => __('This booking can no longer be cancelled because check-in has already started.'),
            'voyage_started' => __('This booking can no longer be cancelled because the trip has already started.'),
            default => __('This cancellation link is invalid.'),
        };
    }

    private function toPreviewData(Booking $booking): PublicBookingCancelPreviewData
    {
        $departure = $booking->trip?->scheduled_departure_at;
        $product = $booking->trip?->product;
        $boatType = $product?->relationLoaded('boatType') ? $product->boatType : null;

        return new PublicBookingCancelPreviewData(
            id: (string) $booking->getKey(),
            program_name: $booking->program?->name ?? __('Program'),
            contact_name: (string) ($booking->contact_name ?? ''),
            departure_at: $departure !== null
                ? $departure->timezone(config('app.timezone'))->toIso8601String()
                : '',
            ticket_summary: BookingMailFormatter::formatTicketSummary($booking),
            product_name: $product?->name,
            product_description: $product?->description,
            product_banner_url: $product?->getImageUrl('banner'),
            boat_type_banner_url: $boatType?->getImageUrl('banner'),
        );
    }
}
