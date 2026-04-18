<?php

namespace App\Http\Controllers;

use App\Http\Resources\BookingCandidateResource;
use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingCandidateController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate(['date'=>'date_format:Y-m-d|required']);
        $date = new Carbon($validated['date'].' midnight');

        $bookingCandidates = Trip::getBookingCandidates($date);

        return BookingCandidateResource::collection($bookingCandidates);
    }
}
