<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index()
    {
        return ActivityResource::collection(Activity::all());
    }

    public function show(Request $request, Activity $activity)
    {
        return new ActivityResource($activity);
    }

    public function store(Request $request)
    {
        $this->authorize('update', BoatCategory::class);
        $validated = $this->validator($request);
        $activity = Activity::create($validated);

        return (new ActivityResource($activity))->response()->setStatusCode(201);
    }

    public function update(Request $request, Activity $activity)
    {
        $this->authorize('update', $activity);
        $validated = $this->validator($request);
        $activity->update($validated);

        return new ActivityResource($activity);
    }

    public function destroy(Activity $activity)
    {
        $this->authorize('delete', $activity);
        $activity->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>['required', 'max:255', 'string'],
            'description_fr'=>['nullable', 'max:1000', 'string'],
            'description_en'=>['nullable', 'max:1000', 'string'],
            'rules_fr'=>['nullable', 'max:3000', 'string'],
            'rules_en'=>['nullable', 'max:3000', 'string'],
        ]);
    }
}
