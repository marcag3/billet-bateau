<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\Client;
use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = [
            'for_date'=>['required', 'date_format:Y-m-d', 'after_or_equal:'.date('Y-m-d')],
            'trip_id'=>['required', 'integer', 'exists:trips,id'],
            'number_of_adults'=>['required', 'integer', 'min:0', 'max:30'],
            'number_of_teens'=>['nullable', 'integer', 'min:0', 'max:30'],
            'number_of_children'=>['required', 'integer', 'min:0', 'max:30'],
            'number_of_boats'=>['required_if:is_full_boat,true', 'integer', 'min:0'],
            'is_guided'=>['required', 'boolean'],
            'note'=>['nullable', 'string', 'max:255'],
            'is_full_boat'=>['boolean', 'required'],
        ];
        if (Auth::guard('user')->check()) {
            $rules = $rules + [
                'confirmed_at'=>'nullable|date',
                'client_id'=>'required|exists:clients,id',
            ];
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $validated = $validator->validated();
            $requestedPassengers = $validated['number_of_adults'] + $validated['number_of_teens'] + $validated['number_of_children'];
            $date = new Carbon($validated['for_date'].' midnight');
            $trips = Trip::active($date);
            $client = Auth::guard('user')->check() ? Client::find($validated['client_id']) : Auth::user();

            if ($requestedPassengers < 1) {
                $validator->errors()->add('number_of_passengers', __('There must be at least one person in the booking'));
            }
            if ($validated['is_guided'] == false && ! $client->is_guided) {
                $validator->errors()->add('is_guided', __('You must be guided first to make a location'));
            }

            $trip = Trip::find($validated['trip_id']);

            if ($validated['is_full_boat']) {
                $totalLimit = $trip->boatCategory->total_capacity * $validated['number_of_boats'];
                $teenLimit = $trip->boatCategory->teen_capacity * $validated['number_of_boats'];
                $childLimit = $trip->boatCategory->tchild_capacity * $validated['number_of_boats'];
            } else {
                $bookingCandidate = $trip->getThisBookingCandidate($date, $trips);
                $totalLimit = $bookingCandidate['total_availability'];
                $teenLimit = $bookingCandidate['teen_availability'];
                $childLimit = $bookingCandidate['child_availability'];
            }

            if ($totalLimit < $requestedPassengers) {
                $validator->errors()->add('number_of_passengers', __('There is not enough places in this trip'));
            }
            if ($teenLimit < $validated['number_of_teens']) {
                $validator->errors()->add('number_of_teens', __('There is not enough place for teens in this trip'));
            }
            if ($childLimit < $validated['number_of_children']) {
                $validator->errors()->add('number_of_children', __('There is not enough place for children in this trip'));
            }
            if (($requestedPassengers / $validated['number_of_boats']) < $trip->boatCategory->minimum_booking_person) {
                $validator->errors()->add('number_of_passengers', __('There must be at least :min person in each boat', ['min'=>$trip->boatCategory->minimum_booking_person]));
            }
        });
    }
}
