<?php

namespace App\Http\Controllers;

use App\Http\Resources\RouteResource;
use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;

class RouteController extends Controller
{
    public function index()
    {
        return RouteResource::collection(Route::all());
    }

    public function show(Request $request, Route $route)
    {
        return new RouteResource($route);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Route::class);

        $validated = $this->validator($request);

        $route = Route::create(Arr::only($validated, ['name', 'area_id']));

        foreach ($validated['route_stops'] as $routeStop) {
            $route->routeStops()->create($routeStop);
        }
        $route->refresh();

        return (new RouteResource($route))->response()->setStatusCode(201);
    }

    public function update(Request $request, Route $route)
    {
        $this->authorize('update', $route);
        $validated = $this->validator($request);
        $route->update(Arr::only($validated, ['name', 'area_id']));

        $updatedStopSequences = collect($validated['route_stops'])->pluck('stop_sequence');

        $route->routeStops()->whereNotIn('stop_sequence', $updatedStopSequences)->delete();

        foreach ($validated['route_stops'] as $routeStop) {
            $route->routeStops()->updateOrCreate(['stop_sequence'=>$routeStop['stop_sequence']],
            ['arrival_minutes' => $routeStop['arrival_minutes'], 'stop_id' => $routeStop['stop_id']]);
        }
        $route->refresh();

        return new RouteResource($route);
    }

    public function destroy(Route $route)
    {
        $this->authorize('delete', $route);
        $route->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>'required|string|max:255',
            'area_id'=>'required|exists:areas,id',
            'route_stops'=>'array',
            'route_stops.*'=>'array',
            'route_stops.*.stop_sequence'=>['required', 'integer'],
            'route_stops.*.arrival_minutes'=>['required', 'integer'],
            'route_stops.*.stop_id'=>['required', 'exists:stops,id'],
        ]);
    }
}
