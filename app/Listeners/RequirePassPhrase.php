<?php

namespace App\Listeners;

use App\Notifications\AdvisePassPhrase;
use App\Utilities\PassPhrase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RequirePassPhrase
{
    protected $generator;

    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct(PassPhrase $generator)
    {
        $this->generator = $generator;
    }

    /**
     * Handle the event.
     *
     * @param  object  $event
     * @return void
     */
    public function handle($event)
    {
        // don't need to interrupt the process if the user
        // logged in with remember token
        if (Auth::viaRemember()) {
            return;
        }

        $passphrase = $this->generator->passPhrase(3);
        $passphraseExpiry = now()->addMinutes(15)->timestamp;

        DB::table('login_links')->updateOrInsert([
            'email' => $event->client->email,
        ],
        [
            'passphrase' => Hash::make($passphrase),
            'passphrase_expiry' => $passphraseExpiry,
        ]);

        if (config('mail.send_email')) {
            $event->client->notify(new AdvisePassPhrase($passphrase, $passphraseExpiry));
        } else {
            dump($passphrase);
        }
    }
}
