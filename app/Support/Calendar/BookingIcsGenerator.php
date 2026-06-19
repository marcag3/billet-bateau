<?php

namespace App\Support\Calendar;

use App\Models\Booking;
use App\Models\Program;
use App\Support\BookingMailFormatter;
use Spatie\IcalendarGenerator\Components\Calendar;
use Spatie\IcalendarGenerator\Components\Event;
use Spatie\IcalendarGenerator\Enums\EventStatus;

final class BookingIcsGenerator
{
    private const int DEFAULT_DURATION_MINUTES = 60;

    public function generate(Booking $booking): ?string
    {
        $trip = $booking->trip;
        $departure = $trip?->scheduled_departure_at;

        if ($departure === null) {
            return null;
        }

        $program = $booking->program;
        $product = $trip->product;
        $timezone = config('app.timezone');
        $startsAt = $departure->copy()->timezone($timezone);
        $endsAt = $startsAt->copy()->addMinutes($this->resolveDurationMinutes($product?->waterRoute?->duration_minutes));

        $event = Event::create($this->formatTitle($program, $product?->name))
            ->uniqueIdentifier($this->uniqueIdentifier($booking))
            ->startsAt($startsAt)
            ->endsAt($endsAt)
            ->description($this->formatDescription($booking))
            ->status(EventStatus::Confirmed)
            ->organizer(
                (string) config('mail.from.address'),
                (string) config('mail.from.name'),
            );

        $location = $this->formatLocation($program);
        if ($location !== null) {
            $event->address($location);
        }

        $calendarName = $program?->name ?? (string) config('app.name');

        return Calendar::create($calendarName)
            ->event($event)
            ->get();
    }

    private function resolveDurationMinutes(?int $waterRouteDurationMinutes): int
    {
        if ($waterRouteDurationMinutes !== null && $waterRouteDurationMinutes > 0) {
            return $waterRouteDurationMinutes;
        }

        return self::DEFAULT_DURATION_MINUTES;
    }

    private function formatTitle(?Program $program, ?string $productName): string
    {
        $programName = $program?->name;

        if ($programName !== null && $programName !== '' && $productName !== null && $productName !== '') {
            return $programName.' — '.$productName;
        }

        if ($programName !== null && $programName !== '') {
            return $programName;
        }

        if ($productName !== null && $productName !== '') {
            return $productName;
        }

        return (string) config('app.name');
    }

    private function formatDescription(Booking $booking): string
    {
        $lines = [
            __('Référence de réservation : :id', ['id' => $booking->getKey()]),
            __('Contact : :name', ['name' => $booking->contact_name]),
            __('Billets : :summary', ['summary' => BookingMailFormatter::formatTicketSummary($booking)]),
        ];

        return implode("\n", $lines);
    }

    private function formatLocation(?Program $program): ?string
    {
        if ($program === null) {
            return null;
        }

        $parts = array_filter([
            $program->line_1,
            $program->line_2,
            $program->city,
            $program->postal_code,
            $program->country,
        ], static fn (?string $value): bool => is_string($value) && trim($value) !== '');

        if ($parts === []) {
            return null;
        }

        return implode(', ', $parts);
    }

    private function uniqueIdentifier(Booking $booking): string
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST) ?: 'localhost';

        return 'booking-'.$booking->getKey().'@'.$host;
    }
}
