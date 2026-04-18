<?php

namespace App\Http\Controllers;

use App\Http\Resources\StopResource;
use App\Models\Stop;
use Illuminate\Http\Request;

class StopController extends Controller
{
    public function index()
    {
        return StopResource::collection(Stop::all());
    }

    public function show(Request $request, Stop $stop)
    {
        return new StopResource($stop);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Stop::class);
        $validated = $this->validator($request);

        $stop = Stop::create($validated);

        return (new StopResource($stop))->response()->setStatusCode(201);
    }

    public function update(Request $request, Stop $stop)
    {
        $this->authorize('update', $stop);
        $validated = $this->validator($request);

        $stop->update($validated);

        return new StopResource($stop);
    }

    public function destroy(Stop $stop)
    {
        $this->authorize('delete', $stop);
        $stop->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>['required', 'string', 'max:255'],
            'lat'=>['required', 'numeric'],
            'long'=>['required', 'numeric'],
        ]);
    }
}
