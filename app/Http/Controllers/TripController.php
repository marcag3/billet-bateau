<?php

namespace App\Http\Controllers;

use App\Models\Calendar;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('calendarId') && filter_var($request->calendarId, FILTER_VALIDATE_INT)) {
            $trips = Calendar::find($request->calendarId)->trips()->with(['route.routeStops', 'boatCategory'])->orderBy('start_time', 'asc')->get();
        } else {
            $trips = Trip::with(['route.routeStops', 'boatCategory'])->orderBy('start_time', 'asc')->get();
        }

        return TripResource::collection($trips);
    }

    public function show(Request $request, Trip $trip)
    {
        return new TripResource($trip);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Trip::class);
        $validated = $this->validator($request);

        $trip = Trip::create($validated);

        return (new TripResource($trip))->response()->setStatusCode(201);
    }

    public function update(Request $request, Trip $trip)
    {
        $this->authorize('update', $trip);
        $validated = $this->validator($request);

        $trip->update($validated);

        return new TripResource($trip);
    }

    public function destroy(Trip $trip)
    {
        $this->authorize('delete', $trip);
        $trip->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'route_id' => ['required', 'exists:routes,id'],
            'service_id' => ['required', 'exists:calendars,id'],
            'boat_category_id'=> ['required', 'exists:boat_categories,id'],
            'start_time' => ['required', 'date_format:H:i'],
            'boat_inventory_id' => ['nullable', 'integer', 'exists:boat_inventories,id'],
            'guided'=>['required', 'integer', Rule::in(collect(config('enums.trip_guided'))->keys())],
        ]);
    }
}
