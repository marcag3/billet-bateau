<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreatePublicBookingAction;
use App\Data\Programs\PublicBookingOptionsData;
use App\Data\Programs\PublicBookingStoreData;
use App\Data\Programs\PublicBookingTicketTypeOptionData;
use App\Data\Programs\PublicBookingTripOptionData;
use App\Http\Controllers\Controller;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;

class PublicBookingController extends Controller
{
    public function bookingOptions(Program $program): JsonResponse
    {
        $trips = $program->trips()
            ->where('scheduled_departure_at', '>=', now())
            ->orderBy('scheduled_departure_at')
            ->with([
                'product' => static function ($query): void {
                    $query->select([
                        'id',
                        'program_id',
                        'boat_type_id',
                        'water_route_id',
                        'capacity',
                        'name',
                        'description',
                        'banner_object_key',
                    ]);
                },
                'product.boatType:id,name,banner_object_key',
                'product.waterRoute:id,name,duration_minutes,trace',
            ])
            ->get(['id', 'program_id', 'product_id', 'scheduled_departure_at']);

        $tripIds = $trips->pluck('id')->map(static fn ($id): string => (string) $id)->all();

        $usageByTripId = [];
        if ($tripIds !== []) {
            $usageByTripId = BookingTicket::query()
                ->join('bookings', 'bookings.id', '=', 'booking_tickets.booking_id')
                ->whereIn('bookings.trip_id', $tripIds)
                ->selectRaw('bookings.trip_id as trip_id, count(*) as c')
                ->groupBy('bookings.trip_id')
                ->pluck('c', 'trip_id')
                ->all();
        }

        $tripOptions = $trips->map(function (Trip $trip) use ($usageByTripId): PublicBookingTripOptionData {
            $tripKey = (string) $trip->getKey();
            $used = (int) ($usageByTripId[$tripKey] ?? 0);

            return PublicBookingTripOptionData::fromTrip($trip, $used);
        })->all();

        $ticketTypeOptions = $program->ticketTypes()
            ->orderBy('title')
            ->get()
            ->map(static fn ($type): PublicBookingTicketTypeOptionData => PublicBookingTicketTypeOptionData::fromModel($type))
            ->all();

        $payload = new PublicBookingOptionsData(
            trips: $tripOptions,
            ticket_types: $ticketTypeOptions,
            booking_questions: collect($program->booking_questions ?? [])
                ->map(static fn ($question): string => trim((string) $question))
                ->filter(static fn (string $question): bool => $question !== '')
                ->values()
                ->all(),
        );

        return response()->json([
            'data' => $payload,
        ]);
    }

    public function store(Program $program, PublicBookingStoreData $data, CreatePublicBookingAction $createPublicBooking): JsonResponse
    {
        $created = $createPublicBooking->handle($program, $data);

        return response()->json([
            'data' => $created,
        ], 201);
    }
}
