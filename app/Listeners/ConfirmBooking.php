<?php

namespace App\Listeners;

use App\Models\Booking;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ConfirmBooking
{
    /**
     * Create the event listener.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  object  $event
     * @return void
     */
    public function handle($event)
    {
        //need to validate if a booking is confirmed
        //a booking is confirmed when the client has filled the client form with the minimum information
        //and if the client has enough products or subscriptions in his account to embark all the people of the booking
        $client = $event->client;
        $client->loadMissing('tickets.product', 'bookings.trip');
        $tickets = $client->tickets;
        $bookings = $client->bookings->sortBy(function ($booking) {
            return $booking->trip->start_time;
        })
        ->sortBy('for_date');

        if ($client->is_profile_complete) {
            foreach ($bookings as $booking) {

                //TODO: should we allow multiple subscriptions for same booking?
                $possibleSubscriptions = $client->possibleBoardingSubscriptions($booking);
                $booking->matchSubscriptions($possibleSubscriptions);
                if ($booking->is_matched_with_boarding_item) {
                    break;
                }

                //TODO: add available free products (children) ?
                //or total client using the same product in the same sailing plan is less than max passenger

                $possibleTickets = $tickets->filter(function ($ticket) use ($booking, $client) {
                    return $ticket->product->isBoardingPossible($client, $booking);
                })
                ->sortBy('price'); //use the lowest price first
                // dump($booking->unmatched_boat_count);

                $tickets = $booking->matchTickets($possibleTickets);
                // dump($booking->unmatched_boat_count);
            }

            //confirm the bookings that needs to be confirmed
            $bookings->filter(function ($booking) {
                return $booking->is_matched_with_boarding_item;
            })
            ->where('confirmed_at', null)
            ->each(function ($booking) {
                $booking->update(['confirmed_at'=>now()]);
            });
        }

        //un-confirm the bookings that needs to be un-confirmed
        Booking::withoutEvents(function () use ($bookings) {
            $bookings->filter(function ($booking) {
                return ! $booking->is_matched_with_boarding_item;
            })
            ->whereNotNull('confirmed_at')
            ->each(function ($booking) {
                $booking->update(['confirmed_at'=>null]);
            });
        });
    }
}
