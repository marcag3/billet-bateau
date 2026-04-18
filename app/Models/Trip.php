<?php

namespace App\Models;

use App\Models\Booking;
use App\Models\Calendar;
use App\Models\SailingPlan;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class Trip extends Model
{
    use HasFactory;
    use softDeletes;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'boat_category',
    ];

    protected $casts = [
        'start_time' => 'datetime',
    ];

    protected $with = ['boatInventory'];

    public static function active(Carbon $date)
    {
        $services = Calendar::active($date)->with([
            'trips.bookings' => function ($query) use ($date) {
                $query->whereDate('for_date', $date);
            },
            'trips.boatCategory',
            'trips.boatInventory',
            'trips.route',
            'trips.sailingPlans' => function ($query) use ($date) {
                $query->whereDate('departure', $date);
            },
        ])->get();

        $trips = $services->reduce(function ($trips, $service) {
            if ($trips === null) {
                $trips = $service->trips;
            } else {
                $trips = $trips->concat($service->trips);
            }

            return $trips;
        });

        if ($trips === null) {
            return;
        }

        $trips = $trips->sortBy('start_time')->values();

        return $trips;
    }

    public static function getBookingCandidates(Carbon $date)
    {
        $trips = self::active($date);

        if ($trips === null) {
            return collect();
        }

        $bookingCandidates = $trips->map(function ($trip) use ($date, $trips) {
            if ($trip->sailingPlans->count() == 0) {
                return $trip->getThisBookingCandidate($date, $trips);
            }
        })->filter()->values();

        return $bookingCandidates;
    }

    public function getThisBookingCandidate(Carbon $date, Collection $trips)
    {
        if ($this->boatInventory) {
            $inventory = $this->boatInventory->quantity;
            $bookings = $this->tripsUsingSameInventory($trips)->reduce(function ($bookings, $trip) use ($date) {
                if ($bookings === null) {
                    return $trip->bookings->where('for_date', $date);
                } else {
                    return $bookings->concat($trip->bookings->where('for_date', $date));
                }
            });
        } else {
            $inventory = 1;
            $bookings = $this->bookings->where('for_date', $date);
        }

        $adults = $bookings->where('is_full_boat', false)->sum('number_of_adults');
        $teens = $bookings->where('is_full_boat', false)->sum('number_of_teens');
        $children = $bookings->where('is_full_boat', false)->sum('number_of_children');
        $total_passengers = $adults + $teens + $children;

        //nombre de bateaux utilisé par les réservation bateau complet
        $charteredBoats = $bookings->where('is_full_boat', true)->sum('number_of_boats');

        //nombre de bateaux utilisés par les réservations non bateau complet
        //@TODO: optimize booking placement (keep people from same booking in the same boat)
        //https://fr.wikipedia.org/wiki/Probl%C3%A8me_du_sac_%C3%A0_dos
        //https://fr.wikipedia.org/wiki/Programmation_dynamique
        //https://fr.wikipedia.org/wiki/Diviser_pour_r%C3%A9gner_(informatique)
        $filledBoats = ceil($total_passengers / $this->boatCategory->total_capacity);

        //non chartered capacity
        $teen_capacity = $this->boatCategory->teen_capacity * ($inventory - $charteredBoats);
        $child_capacity = $this->boatCategory->child_capacity * ($inventory - $charteredBoats);

        $total_availability = $this->boatCategory->total_capacity * ($inventory - $charteredBoats) - $total_passengers;

        $bookingCandidate = [
            'trip_id' => $this->id,
            'total_availability' => $total_availability,
            'teen_availability' => min($teen_capacity - $teens, $total_availability),
            'child_availability' => min($child_capacity - $children, $total_availability),
            'boat_availability' => $inventory - $charteredBoats - $filledBoats,
            'guided'=> $this->guided,
            'for_date' => $date,
            'is_only_full_boat'=>1,
        ];
        if (Auth::guard('user')->check()) {
            $bookingCandidate['total_capacity'] = $this->boatCategory->total_capacity * $inventory;
        }

        return $bookingCandidate;
    }

    private function tripsUsingSameInventory(Collection $trips)
    {
        return $trips->where('boat_inventory_id', $this->boat_inventory_id)->filter(function ($trip) {
            return ($trip->start_time->gte($this->start_time) && $trip->start_time->lt($this->end_time)) ||
                    ($this->start_time->gte($trip->start_time) && $this->start_time->lt($trip->end_time));
        });
    }

    //getters

    public function getEndTimeAttribute()
    {
        return $this->start_time->addMinutes($this->route->duration);
    }

    public function getDurationAttribute()
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    //relationships

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function calendar()
    {
        return $this->belongsTo(Calendar::class, 'service_id');
    }

    public function boatCategory()
    {
        return $this->belongsTo(BoatCategory::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function sailingPlans()
    {
        return $this->hasMany(SailingPlan::class);
    }

    public function boatInventory()
    {
        return $this->belongsTo(BoatInventory::class);
    }
}
