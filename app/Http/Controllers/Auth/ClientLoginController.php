<?php

namespace App\Http\Controllers\Auth;

use App\Models\Client;
use App\Events\ClientLogin;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientLoginRequest;
use App\Http\Requests\ClientPassphraseRequest;
use App\Http\Resources\ClientResource;
use App\Utilities\PassPhrase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class ClientLoginController extends Controller
{
    public function requestPassPhrase(ClientPassphraseRequest $request)
    {

        //honeypot
        if ($request['name']) {
            return response()->json('Félicitation');
        }

        $validated = $request->validated();

        $client = Client::where('email', $validated['email'])->first();

        if ($client) {
            ClientLogin::dispatch($client);
        }

        return response()->json('continue');
    }

    public function login(ClientLoginRequest $request)
    {
        //honeypot
        if ($request['name']) {
            return response()->json('Félicitation');
        }

        $validated = $request->validated();
        // credentials are valid

        DB::table('login_links')->where('email', $validated['email'])->delete();
        $request->session()->regenerate();

        $client = Client::where('email', $validated['email'])->first();
        Auth::guard('client')->login($client);

        return new ClientResource($client);
    }

    public function checkLogin()
    {

        //return client if already authentificated
        if ($client = Auth::guard('client')->user()) {
            return new ClientResource($client);
        }
    }

    public function logout(Request $request)
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Response()->json();
    }

    public function register(Request $request)
    {

        //honeypot
        if ($request['name']) {
            return response()->json();
        }

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        //retrieve client or create it
        $client = Client::firstOrCreate(['email' => $validated['email']]);

        // If client exist, send passPhrase
        if ($client) {
            ClientLogin::dispatch($client);
        }

        // either way, return a success message
        return response()->json('continue');
    }

    protected function validator(Request $request)
    {
        return $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'passphrase' => ['required', 'string', 'max:255'],
        ]);
    }
}
