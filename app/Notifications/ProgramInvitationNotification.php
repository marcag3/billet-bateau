<?php

namespace App\Notifications;

use App\Models\ProgramInvitation;
use App\Support\AppLocale;
use App\Support\ProgramTimezone;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProgramInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ProgramInvitation $invitation,
        public string $plainToken,
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
        $programName = $this->invitation->program?->name ?? __('Program');
        $acceptUrl = url('/app/invite/'.$this->plainToken);
        $expiresLabel = ProgramTimezone::formatDateTime(
            $this->invitation->expires_at,
            $locale,
            $this->invitation->program,
        );

        return (new MailMessage)
            ->subject(__('You have been invited to manage :program', ['program' => $programName]))
            ->line(__('You were invited to join :program as an administrator.', ['program' => $programName]))
            ->action(__('Accept invitation'), $acceptUrl)
            ->line(__('This invitation expires on :date.', ['date' => $expiresLabel]));
    }
}
