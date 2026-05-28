<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Support\Calendar\BookingIcsGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class BookingConfirmationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->booking->load([
            'program:id,name,line_1,line_2,city,postal_code,country',
            'trip:id,scheduled_departure_at,product_id',
            'trip.product:id,name,water_route_id',
            'trip.product.waterRoute:id,duration_minutes',
            'bookingTickets.ticketType:id,title',
        ]);

        $programName = $this->booking->program?->name ?? 'Programme';
        $departure = $this->booking->trip?->scheduled_departure_at;
        $departureLabel = $departure !== null
            ? $departure->timezone(config('app.timezone'))->locale('fr')->isoFormat('dddd D MMMM YYYY [à] HH:mm')
            : '—';
        $productName = $this->booking->trip?->product?->name;
        $ticketSummary = $this->formatTicketSummary();

        $message = (new MailMessage)
            ->subject(__('Confirmation de réservation — :program', ['program' => $programName]))
            ->greeting(__('Bonjour :name,', ['name' => $this->booking->contact_name]))
            ->line(__('Merci pour votre réservation pour :program.', ['program' => $programName]))
            ->line(__('Référence de réservation : :id', ['id' => $this->booking->getKey()]));

        if ($productName !== null && $productName !== '') {
            $message->line(__('Sortie : :product', ['product' => $productName]));
        }

        $message
            ->line(__('Départ : :departure', ['departure' => $departureLabel]))
            ->line(__('Billets : :summary', ['summary' => $ticketSummary]));

        $ics = app(BookingIcsGenerator::class)->generate($this->booking);
        if ($ics !== null) {
            $message->attachData($ics, 'reservation.ics', [
                'mime' => 'text/calendar',
                'charset' => 'utf-8',
            ]);
        }

        return $message->line(__('Conservez ce courriel pour votre référence.'));
    }

    private function formatTicketSummary(): string
    {
        /** @var Collection<int, string> $lines */
        $lines = $this->booking->bookingTickets
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
            return (string) $this->booking->bookingTickets->count();
        }

        return $lines->implode(', ');
    }
}
