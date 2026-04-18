<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\URL;

class AdvisePassPhrase extends Notification
{
    use Queueable;

    public $passphrase;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(string $passphrase, string $passphraseExpiry)
    {
        $this->passphrase = $passphrase;
        $this->passphraseExpiry = $passphraseExpiry;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage())
            ->subject(__('auth.loginEmailSubject'))
            ->line(__('auth.emailFirstLine'))
            ->line($this->passphrase)
            ->line(__('auth.click_button'))
            ->action(__('auth.emailAction'), url('/client/connection?url='.urlencode(URL::temporarySignedRoute(
                'client.login-link',
                now()->addMinutes(15),
                [
                    'email' => $notifiable->email,
                    'passphrase' => $this->passphrase,
                    'passphrase_expiry'=>$this->passphraseExpiry,
                ], false)))
            )
            ->line(__('auth.emaillastLine'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            //
        ];
    }
}
