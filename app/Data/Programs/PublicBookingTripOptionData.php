<?php

namespace App\Data\Programs;

use App\Models\Trip;
use Clickbar\Magellan\Facades\GeojsonGenerator;
use Spatie\LaravelData\Data;

final class PublicBookingTripOptionData extends Data
{
    public function __construct(
        public string $id,
        public string $scheduled_departure_at,
        public int $capacity,
        public int $remaining_capacity,
        public string $product_id,
        public string $product_name,
        public ?string $product_description,
        public ?string $boat_type_id,
        public ?string $boat_type_name,
        public ?string $boat_type_banner_url,
        public ?string $water_route_id,
        public ?string $water_route_name,
        public ?int $water_route_duration_minutes,
        public ?string $water_route_trace_geojson,
        public ?string $product_banner_url,
    ) {}

    public static function fromTrip(Trip $trip, int $usedSeatCount): self
    {
        $product = $trip->product;
        if ($product === null) {
            throw new \InvalidArgumentException('Trip must have product (and relations) loaded for public booking options.');
        }

        $capacity = (int) $product->capacity;
        $remaining = max(0, $capacity - $usedSeatCount);

        $boatType = $product->relationLoaded('boatType') ? $product->boatType : null;
        $boatTypeId = $boatType !== null ? (string) $boatType->getKey() : null;
        $boatTypeName = $boatType !== null ? (string) $boatType->name : null;
        $boatTypeBannerUrl = $boatType !== null ? $boatType->getImageUrl('banner') : null;
        $waterRoute = $product->relationLoaded('waterRoute') ? $product->waterRoute : null;
        $waterRouteId = $waterRoute !== null ? (string) $waterRoute->getKey() : null;
        $waterRouteName = $waterRoute !== null ? (string) $waterRoute->name : null;
        $waterRouteDurationMinutes = $waterRoute !== null ? (int) $waterRoute->duration_minutes : null;
        $waterRouteTraceGeoJson = null;
        if ($waterRoute !== null && $waterRoute->trace !== null) {
            try {
                $traceGeoJson = GeojsonGenerator::generate($waterRoute->trace);
                $encodedGeoJson = json_encode($traceGeoJson, JSON_UNESCAPED_SLASHES);
                $waterRouteTraceGeoJson = is_string($encodedGeoJson) ? $encodedGeoJson : null;
            } catch (\Throwable) {
                $waterRouteTraceGeoJson = null;
            }
        }

        $bannerUrl = $product->getImageUrl('banner');

        return new self(
            id: (string) $trip->getKey(),
            scheduled_departure_at: $trip->scheduled_departure_at->toIso8601String(),
            capacity: $capacity,
            remaining_capacity: $remaining,
            product_id: (string) $product->getKey(),
            product_name: (string) $product->name,
            product_description: $product->description,
            boat_type_id: $boatTypeId,
            boat_type_name: $boatTypeName,
            boat_type_banner_url: $boatTypeBannerUrl,
            water_route_id: $waterRouteId,
            water_route_name: $waterRouteName,
            water_route_duration_minutes: $waterRouteDurationMinutes,
            water_route_trace_geojson: $waterRouteTraceGeoJson,
            product_banner_url: $bannerUrl,
        );
    }
}
