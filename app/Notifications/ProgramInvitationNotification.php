<?php

namespace App\Notifications;

use App\Models\ProgramInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProgramInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ProgramInvitation $invitation,
        public string $plainToken,
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
        $this->invitation->loadMissing('program');

        $programName = $this->invitation->program?->name ?? __('Program');
        $acceptUrl = url('/app/invite/'.$this->plainToken);

        return (new MailMessage)
            ->subject(__('You have been invited to manage :program', ['program' => $programName]))
            ->line(__('You were invited to join :program as an administrator.', ['program' => $programName]))
            ->action(__('Accept invitation'), $acceptUrl)
            ->line(__('This invitation expires on :date.', ['date' => $this->invitation->expires_at->toDayDateTimeString()]));
    }
}
