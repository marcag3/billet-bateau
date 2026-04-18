<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Client;
use App\Http\Requests\BookingRequest;
use App\Http\Resources\BookingResource;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Booking::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            $bookings = $client->bookings()->futur()->get();

            return BookingResource::collection($bookings);
        }

        $validated = $request->validate([
            'date'=>'date_format:Y-m-d|nullable',
            'client_id'=>'nullable|exists:clients,id',
        ]);

        $bookings = Booking::with('client');
        if (array_key_exists('date', $validated)) {
            // $date = new Carbon($validated['date']. " midnight");
            $bookings = $bookings->whereDate('for_date', $validated['date']);
        }
        if (array_key_exists('client_id', $validated)) {
            $bookings = $bookings->where('client_id', $validated['client_id']);
        }

        return BookingResource::collection($bookings->get());
    }

    public function show(Request $request, ?Client $client, Booking $booking)
    {
        $this->authorize('view', [$booking, $client]);

        return new BookingResource($booking);
    }

    public function store(BookingRequest $request, ?Client $client = null)
    {
        $this->authorize('create', [Booking::class, $client]);

        $validated = $request->validated();

        if (get_class(Auth::user()) === Client::class) {
            $validated['client_id'] = Auth::user()->id;
        } else {
            $validated['user_id'] = Auth::guard('user')->id();
            $validated['confirmed_at'] = Carbon::now();
        }

        $booking = Booking::create($validated);

        return (new BookingResource($booking))->response()->setStatusCode(201);
    }

    public function update(BookingRequest $request, ?Client $client, Booking $booking)
    {
        $this->authorize('update', [$booking, $client]);
        $validated = $request->validated();
        if (get_class(Auth::user()) === Client::class) {
            $validated['client_id'] = Auth::user()->id;
        } else {
            $validated['user_id'] = Auth::guard('user')->id();
            $validated['confirmed_at'] = Carbon::now();
        }
        $booking->update($validated);

        return new BookingResource($booking);
    }

    public function destroy(?Client $client, Booking $booking)
    {
        $this->authorize('delete', [$booking, $client]);

        $booking->delete();

        return response()->json();
    }
}
