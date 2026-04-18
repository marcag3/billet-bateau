<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ClientSimpleResource;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Client::class, 'client');
    }

    public function index(Request $request)
    {
        return ClientSimpleResource::collection(Client::with('subscriptions')->orderBy('updated_at', 'desc')->get());
    }

    public function show(Request $request, Client $client)
    {
        return new ClientResource($client);
    }

    public function store(ClientRequest $request)
    {
        $validated = $request->validated();

        $client = Client::create($validated);

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    public function update(ClientRequest $request, Client $client)
    {
        $validated = $request->validated();

        $client->update($validated);

        return new ClientResource($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return response()->json();
    }

    public function searchAjax(Request $request)
    {
        $validated = $request->validate([
            'q'=>'required',
        ]);

        //TODO: create problems with hyphens
        $q = str_ireplace('-', ' ', $validated['q']);

        $searchResult = Client::search($q)->get()->transform(function ($client) {
            return [
                'id'=>$client->id,
                'text'=>$client->identifier,
            ];
        });

        return response()->json($searchResult);
    }

    public function ajax(Request $request)
    {
        $clients = Client::select('id', 'firstName', 'name', 'homephone', 'cellphone', 'emergencyPhone')
            ->paginate(10);

        return response()->json($clients);
    }
}
