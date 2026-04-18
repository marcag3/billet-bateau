<?php

namespace App\Http\Controllers;

use App\Models\Calendar;
use App\Http\Resources\CalendarResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Calendar::class, 'calendar');
    }

    public function index()
    {
        return CalendarResource::collection(Calendar::all());
    }

    public function show(Calendar $calendar)
    {
        return new CalendarResource($calendar);
    }

    public function store(Request $request)
    {
        $validated = $this->validator($request);

        $calendar = Calendar::create($validated);

        return (new CalendarResource($calendar))->response()->setStatusCode(201);
    }

    public function update(Request $request, Calendar $calendar)
    {
        $validated = $this->validator($request, $calendar);

        $calendar->update($validated);

        return new CalendarResource($calendar);
    }

    public function destroy(Calendar $calendar)
    {
        $calendar->delete();

        return response()->json();
    }

    private function validator(Request $request, ?Calendar $calendar = null)
    {
        return $request->validate([
            'name' => [Rule::unique('calendars')->ignore($calendar)->where('deleted_at', null), 'max:255', 'string', 'required'],
            'monday' => ['boolean'],
            'tuesday' => ['boolean'],
            'wednesday' => ['boolean'],
            'thursday' => ['boolean'],
            'friday' => ['boolean'],
            'saturday' => ['boolean'],
            'sunday' => ['boolean'],
            'start_date' => ['date', 'before:end_date', 'required'],
            'end_date' => ['date', 'after:start_date', 'required'],
        ]);
    }
}
