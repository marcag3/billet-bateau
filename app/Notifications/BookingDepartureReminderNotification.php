<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Support\AppLocale;
use App\Support\BookingMailFormatter;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingDepartureReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public ?string $mailLocale = null,
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
        $locale = AppLocale::normalize($this->mailLocale);
        $previousLocale = app()->getLocale();
        app()->setLocale($locale);

        try {
            return $this->buildMailMessage($locale);
        } finally {
            app()->setLocale($previousLocale);
        }
    }

    private function buildMailMessage(string $locale): MailMessage
    {
        $programName = $this->booking->program?->name ?? __('Program');
        $departure = $this->booking->trip?->scheduled_departure_at;
        $departureLabel = $departure !== null
            ? $departure->timezone(config('app.timezone'))->locale($locale)->isoFormat(
                $locale === 'fr'
                    ? 'dddd D MMMM YYYY [à] HH:mm'
                    : 'dddd, MMMM D, YYYY [at] h:mm A',
            )
            : '—';
        $productName = $this->booking->trip?->product?->name;
        $productDescription = trim((string) ($this->booking->trip?->product?->description ?? ''));
        $ticketSummary = BookingMailFormatter::formatTicketSummary($this->booking);

        $message = (new MailMessage)
            ->subject(__('Rappel — votre réservation pour :program', ['program' => $programName]))
            ->greeting(__('Bonjour :name,', ['name' => $this->booking->contact_name]))
            ->line(__('Votre sortie avec :program part dans environ 24 heures.', ['program' => $programName]))
            ->line(__('Référence de réservation : :id', ['id' => $this->booking->getKey()]));

        if ($productName !== null && $productName !== '') {
            $message->line(__('Sortie : :product', ['product' => $productName]));
        }

        $message
            ->line(__('Départ : :departure', ['departure' => $departureLabel]))
            ->line(__('Billets : :summary', ['summary' => $ticketSummary]));

        if ($productDescription !== '') {
            $message->line($productDescription);
        }

        $plainCancelToken = $this->booking->cancel_token;
        if ($plainCancelToken !== null && $plainCancelToken !== '') {
            $message
                ->line(__('Pour annuler votre réservation, utilisez le bouton ci-dessous.'))
                ->action(
                    __('Annuler la réservation'),
                    url('/bookings/cancel/'.$plainCancelToken),
                );
        }

        return $message
            ->line(__('Conservez ce courriel pour votre référence.'))
            ->salutation(BookingMailFormatter::formatSalutation($this->booking->program?->email_signature));
    }
}
