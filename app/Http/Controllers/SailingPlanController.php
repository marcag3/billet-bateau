<?php

namespace App\Http\Controllers;

use App\Http\Requests\SailingPlanRequest;
use App\Http\Resources\SailingPlanResource;
use App\Models\SailingPlan;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SailingPlanController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SailingPlan::class, 'sailingPlan');
    }

    public function index(Request $request)
    {
        $validated = $request->validate(['date'=>'date_format:Y-m-d|nullable']);

        if ($request->has('date')) {
            $date = new Carbon($validated['date'] ?? '');
            $date->hour = 0;
            $date->minute = 0;
            $date->second = 0;
            $sailingPlans = SailingPlan::whereDate('departure', $date)->get();
        } else {
            $sailingPlans = SailingPlan::orderBy('updated_at', 'desc')->get();
        }

        return SailingPlanResource::collection($sailingPlans);
    }

    public function show(Request $request, SailingPlan $sailingPlan)
    {
        return new SailingPlanResource($sailingPlan);
    }

    public function store(SailingPlanRequest $request)
    {
        $validated = $request->validated();

        $validated['user_id'] = auth()->id();

        $sailingPlan = SailingPlan::create($validated);

        return (new SailingPlanResource($sailingPlan))->response()->setStatusCode(201);
    }

    public function update(SailingPlanRequest $request, SailingPlan $sailingPlan)
    {
        $validated = $request->validated();

        $sailingPlan->update($validated);

        return new SailingPlanResource($sailingPlan);
    }

    public function destroy(SailingPlan $sailingPlan)
    {
        $sailingPlan->delete();

        return response()->json();
    }

    //TODO: to delete
    public function calendarFeed(Request $request)
    {
        $this->authorize('view sailing plans');

        $validated = $request->validate([
            'end'=>'required|date',
            'start'=>'required|date|before:end',
        ]);

        $sailingPlans = SailingPlan::with('boats')
            ->whereBetween('departure', [$validated['start'], $validated['end']])
            ->orWhereBetween('arrival', [$validated['start'], $validated['end']])->get();
        $msg = [];

        foreach ($sailingPlans as $sailingPlan) {
            $msg[] = [
                'id'=>$sailingPlan->id,
                'title'=>$sailingPlan->title,
                'start'=>$sailingPlan->departure->toIso8601String(),
                'end'=> $sailingPlan->arrival->toIso8601String(),
                'resourceIds'=>$sailingPlan->boats->pluck('id')->toArray(),
                'url'=>"/sailingPlans/$sailingPlan->id/edit",
                'status'=>config('enums.sailing_plan_status.'.$sailingPlan->status),
                'guide'=>$sailingPlan->guide->name,
                'route'=>config('enums.routes.'.$sailingPlan->route_id),
                'minor'=>$sailingPlan->number_of_minor,
            ];
            if ($sailingPlan->status == 1) {
                $msg[array_key_last($msg)]['backgroundColor'] = 'Gold';
                $msg[array_key_last($msg)]['borderColor'] = 'Gold';
                $msg[array_key_last($msg)]['textColor'] = 'black';
            } elseif ($sailingPlan->status == 2) {
                $msg[array_key_last($msg)]['backgroundColor'] = 'rgb(23, 162, 184)';
                $msg[array_key_last($msg)]['borderColor'] = 'rgb(23, 162, 184)';
            } elseif ($sailingPlan->status == 3) {
                $msg[array_key_last($msg)]['backgroundColor'] = 'green';
            }
        }

        return response()->json($msg);
    }

    //TODO: to delete

    public function calendarUpdate(Request $request, SailingPlan $sailingPlan)
    {
        $this->authorize('edit sailing plans');

        $validated = $request->validate([
            'date'=>'date|required',
            'enddate'=>'date|required',
            'oldboat'=>'exists:boats,id|nullable',
            'newboat'=>'exists:boats,id|required_with:oldboat',
        ]);

        $sailingPlan->departure = new Carbon($validated['date']);

        $sailingPlan->arrival = new Carbon($validated['enddate']);

        $sailingPlan->save();

        if (isset($validated['oldboat']) && isset($validated['newboat'])) {
            $sailingPlan->boats()->detach($validated['oldboat']);

            $sailingPlan->boats()->attach($validated['newboat']);
        }

        return response()->json('ok');
    }
}
