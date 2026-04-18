<?php

namespace App\Http\Controllers;

use App\Models\CalendarDate;
use Illuminate\Http\Request;

//TODO:
class CalendarDateController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(CalendarDate::class, 'calendarDate');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\CalendarDate  $calendarDate
     * @return \Illuminate\Http\Response
     */
    public function show(CalendarDate $calendarDate)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\CalendarDate  $calendarDate
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, CalendarDate $calendarDate)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\CalendarDate  $calendarDate
     * @return \Illuminate\Http\Response
     */
    public function destroy(CalendarDate $calendarDate)
    {
        //
    }
}
