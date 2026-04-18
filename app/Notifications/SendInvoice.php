<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Spatie\Browsershot\Browsershot;

class SendInvoice extends Notification
{
    use Queueable;

    public $invoice;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
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
        $margin = 6;
        $url = URL::temporarySignedRoute(
            'invoices.pdf', now()->addMinutes(3), ['invoice'=>$this->invoice->id], false
        );
        // use nginx container to route the request
        $url = 'http://webserver'.$url;
        $pdf = Browsershot::url($url)
        ->setOption('args', [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--disable-web-security',
        ])
            ->format('Letter')
            ->margins($margin, $margin, $margin, $margin)
            ->waitUntilNetworkIdle()
            ->noSandbox()
            ->ignoreHttpsErrors()
            ->setNodeBinary('/usr/bin/node')
            ->setNpmBinary('/usr/bin/npm')
            ->dismissDialogs()
            ->pdf();

        return (new MailMessage())
            ->subject(__('invoice.email_subject'))
            ->line(__('invoice.email_line'))
            ->attachData($pdf, 'facture_'.$this->invoice->id.'.pdf', [
                'mime' => 'application/pdf',
            ]);
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
