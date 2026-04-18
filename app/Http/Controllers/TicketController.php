<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Ticket::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            return TicketResource::collection($client->tickets);
        }

        $validated = $request->validate([
            'client_id'=>'nullable|exists:clients,id',
            'withUnavailable'=>'nullable',
        ]);
        $query = Ticket::query();
        if (! array_key_exists('withUnavailable', $validated)) {
            $query = $query->available();
        }
        if (array_key_exists('client_id', $validated)) {
            $query = $query->where('client_id', $validated['client_id']);
        }

        return TicketResource::collection($query->get());
    }

    public function show(Request $request, ?Client $client, Ticket $ticket)
    {
        $this->authorize('view', [$ticket, $client]);

        return new TicketResource($ticket);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);

        $validated = $this->validator($request);

        $ticket = Ticket::create($validated);

        return (new TicketResource($ticket))->response()->setStatusCode(201);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);
        $validated = $this->validator($request);
        $ticket->update($validated);

        return new TicketResource($ticket);
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return response()->json();
    }

    protected function validator(Request $request)
    {
        return $request->validate([
            'product_id'=>'required|exists:products,id',
            'client_id'=>'required|exists:clients,id',
            'remaining_uses'=>'required|integer|min:0',
        ]);
    }
}
