<?php

namespace App\Models;

use App\Models\Client;
use App\Models\Subscription;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\IcalendarGenerator\Components\Calendar;
use Spatie\IcalendarGenerator\Components\Event;
use Spatie\IcalendarGenerator\Enums\EventStatus;

class Booking extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'user_id',
        'trip',
        'boat_category',
    ];

    protected $casts = [
        'for_date' => 'datetime:Y-m-d',
        'confirmed_at' => 'datetime:Y-m-d',
        'is_full_boat' => 'boolean',
        'is_guided' => 'boolean',
    ];

    protected $touches = ['client'];

    protected $unmatchedAdultsCount;

    protected $unmatchedTeensCount;

    protected $unmatchedChildrenCount;

    protected $unmatchedBoatCount;

    //getters
    public function getIsRentalAttribute()
    {
        return ! $this->is_guided;
    }

    public function getPlannedDurationAttribute()
    {
        return $this->trip->duration;
    }

    public function getClientNameAttribute()
    {
        return $this->client->fullName;
    }

    public function getIsMatchedWithBoardingItemAttribute()
    {
        $unmatched_passenger_count = $this->unmatched_adults_count +
            $this->unmatched_teens_count +
            $this->unmatched_children_count;

        return $unmatched_passenger_count === 0 || $this->unmatched_boat_count === 0;
    }

    public function getUnmatchedAdultsCountAttribute()
    {
        if (! isset($this->unmatchedAdultsCount)) {
            $this->unmatchedAdultsCount = $this->number_of_adults;
        }

        return $this->unmatchedAdultsCount;
    }

    public function setUnmatchedAdultsCountAttribute($count)
    {
        $this->unmatchedAdultsCount = $count;
    }

    public function getUnmatchedTeensCountAttribute()
    {
        if (! isset($this->unmatchedTeensCount)) {
            $this->unmatchedTeensCount = $this->number_of_teens;
        }

        return $this->unmatchedTeensCount;
    }

    public function setUnmatchedTeensCountAttribute($count)
    {
        $this->unmatchedTeensCount = $count;
    }

    public function getUnmatchedChildrenCountAttribute()
    {
        if (! isset($this->unmatchedChildrenCount)) {
            $this->unmatchedChildrenCount = $this->number_of_children;
        }

        return $this->unmatchedChildrenCount;
    }

    public function setUnmatchedChildrenCountAttribute($count)
    {
        $this->unmatchedChildrenCount = $count;
    }

    public function getUnmatchedBoatCountAttribute()
    {
        if (! isset($this->unmatchedBoatCount)) {
            $this->unmatchedBoatCount = $this->number_of_boats;
        }

        return $this->unmatchedBoatCount;
    }

    public function setUnmatchedBoatCountAttribute($count)
    {
        $this->unmatchedBoatCount = $count;
    }

    public function toString()
    {
        return
            $this->for_date->isoFormat('D MMMM YYYY').
            ' '.
            $this->trip->start_time->isoFormat('HH:mm').
            ' - '.
            $this->trip->end_time->isoFormat('HH:mm').
            ', '.
            trans_choice('booking.adults', $this->number_of_adults).
            ', '.
            trans_choice('booking.teens', $this->number_of_teens).
            ', '.
            trans_choice('booking.children', $this->number_of_children).
            ', '.
            trans_choice('booking.boats', $this->number_of_boats).
            ', '.
            trans_choice('booking.is_guided', $this->is_guided).
            ', '.
            __('booking.boarding').' '.$this->trip->boatCategory->name.
            ', '.
            __('booking.start from').': '.$this->trip->route->routeStops[0]->stop->name.
            ($this->note !== null ? ', '.__('booking.note').': '.$this->note : '');
    }

    public function getIcalAttribute()
    {
        $event = Event::create(__('Booking').' '.config('app.name'))
        ->startsAt($this->trip->start_time)
        ->endsAt($this->trip->end_time)
        ->description($this->toString())
        ->address(
            $this->trip->route->routeStops[0]->stop->lat.
            ', '.
            $this->trip->route->routeStops[0]->stop->long
        )
        ->organizer('info@laroutedechamplain.com', config('app.name'))
        ->status(EventStatus::confirmed());

        return Calendar::create(config('app.name'))
            ->event($event)
            ->get();
    }

    public function getDateAttribute()
    {
        return $this->for_date;
    }

    //relationships
    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    public function boatCategory()
    {
        return $this->trip->boatCategory();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class)->withDefault(['name'=>'', 'firstName'=>'']);
    }

    public function route()
    {
        return $this->trip->route();
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    //functions

    public function scopeFutur($query)
    {
        return $query->whereDate('for_date', '>=', today());
    }

    public function matchAdults(int $toMatch)
    {
        if ($this->unmatched_adults_count > 0 && $toMatch > 0) {
            $decrease = min($this->unmatched_adults_count, $toMatch);
            $this->unmatched_adults_count -= $decrease;
            $toMatch -= $decrease;
        }

        return $toMatch;
    }

    public function matchTeens(int $toMatch)
    {
        if ($this->unmatched_teens_count > 0) {
            $decrease = min($this->unmatched_teens_count, $toMatch);
            $this->unmatched_teens_count -= $decrease;
            $toMatch -= $decrease;
        }

        return $toMatch;
    }

    public function matchChildren(int $toMatch)
    {
        if ($this->unmatched_children_count > 0) {
            $decrease = min($this->unmatched_children_count, $toMatch);
            $this->unmatched_children_count -= $decrease;
            $toMatch -= $decrease;
        }

        return $toMatch;
    }

    public function matchSubscriptions(Collection $subscriptions)
    {
        foreach ($subscriptions as $subscription) {
            $this->matchSubscription($subscription);
            if ($this->is_matched_with_boarding_item) {
                break;
            }
        }
    }

    public function matchSubscription(Subscription $subscription)
    {
        if ($subscription->is_full_boat) {
            $this->unmatchedBoatCount--;

            return 0;
        }
        $toMatch = $subscription->max_passenger;
        $toMatch = $this->matchAdults($toMatch);
        if ($toMatch === 0) {
            return $toMatch;
        }
        $toMatch = $this->matchTeens($toMatch);
        if ($toMatch === 0) {
            return $toMatch;
        }
        $toMatch = $this->matchChildren($toMatch);

        return $toMatch;
    }

    public function matchTickets(Collection $tickets)
    {
        foreach ($tickets as $ticket) {
            $this->matchTicket($ticket);

            $ticket->remaining_uses--;
            if ($this->is_matched_with_boarding_item) {
                break;
            }
        }

        return $tickets->where('remaining_uses', '>', 0);
    }

    public function matchTicket(Ticket $ticket)
    {
        $this->tickets()->save($ticket);
        $product = $ticket->product;

        if ($product->is_full_boat) {
            $this->unmatchedBoatCount--;

            return 0;
        }
        $toMatch = $product->max_passenger;
        if ($product->is_adult) {
            $toMatch = $this->matchAdults($toMatch);
        }
        if ($product->is_teen && $toMatch > 0) {
            $toMatch = $this->matchTeens($toMatch);
        }
        if ($product->is_child && $toMatch > 0) {
            $toMatch = $this->matchChildren($toMatch);
        }

        return $toMatch;
    }
}
