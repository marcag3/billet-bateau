<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Http\Resources\PassResource;
use App\Models\Pass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PassController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Pass::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            return PassResource::collection($client->passes);
        }

        $validated = $request->validate([
            'client_id'=>'nullable|exists:clients,id',
            'withUnavailable'=>'nullable',
        ]);
        $query = Pass::query();
        if (! array_key_exists('withUnavailable', $validated)) {
            $query = $query->available();
        }
        if (array_key_exists('client_id', $validated)) {
            $query = $query->where('client_id', $validated['client_id']);
        }

        return PassResource::collection($query->get());
    }

    public function show(Request $request, ?Client $client, Pass $pass)
    {
        $this->authorize('view', [$pass, $client]);

        return new PassResource($pass);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Pass::class);

        $validated = $this->validator($request);

        $pass = Pass::create($validated);

        return (new PassResource($pass))->response()->setStatusCode(201);
    }

    public function update(Request $request, Pass $pass)
    {
        $this->authorize('update', $pass);

        $validated = $this->validator($request);

        $pass->update($validated);

        return new PassResource($pass);
    }

    public function destroy(Pass $pass)
    {
        $this->authorize('delete', $pass);

        $pass->delete();

        return response()->json();
    }

    protected function validator(Request $request)
    {
        return $request->validate([
            'subscription_id'=>'required|exists:subscriptions,id',
            'client_id'=>'required|exists:clients,id',
            'expiry_date'=>'required|date',
        ]);
    }
}
