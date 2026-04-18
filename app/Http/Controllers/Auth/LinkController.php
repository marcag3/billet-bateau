<?php

namespace App\Http\Controllers\Auth;

use App\Models\Client;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientLoginRequest;
use App\Http\Resources\ClientResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Log;

class LinkController extends Controller
{
    public function __invoke(ClientLoginRequest $request)
    {
        //honeypot
        if ($request['name']) {
            Log::info('tryed connecting with a login link and a name parameter');
            abort(401);
        }

        if (! $request->hasValidSignature(false)) {
            Log::info('login link has invalid signature', ['secure'=>request()->secure(), 'method'=>request()->method(), 'headers'=>request()->header()]);
            abort(401);
        }

        $validated = $request->validated();

        // credentials are valid
        DB::table('login_links')->where('email', $validated['email'])->delete();
        $request->session()->regenerate();

        $client = Client::where('email', $validated['email'])->first();
        Auth::guard('client')->login($client);
        Log::info('client logged with login link', ['client'=>$client]);

        return new ClientResource($client);
    }
}
