export type BookingTripOption = {
    id: string;
    scheduled_departure_at: string;
    capacity: number;
    remaining_capacity: number;
    product_id: string;
    product_name: string;
    product_description: string | null;
    product_banner_url: string | null;
    boat_type_id: string | null;
    boat_type_name: string | null;
    boat_type_banner_url: string | null;
    water_route_id: string | null;
    water_route_name: string | null;
    water_route_duration_minutes: number | null;
    water_route_trace_geojson: string | null;
};

export type BookingTicketTypeOption = {
    id: string;
    title: string;
    price_cents: number | null;
    is_pay_what_you_can: boolean;
    min_per_purchase: number;
    max_per_purchase: number | null;
    depends_on_ticket_type_id: string | null;
    max_per_reference_ticket: number | null;
};

export type BookingOptionsPayload = {
    trips: BookingTripOption[];
    ticket_types: BookingTicketTypeOption[];
    booking_questions: string[];
};

export type CreatedBookingPayload = {
    id: string;
    trip_id: string;
    total_tickets: number;
    contact_name: string;
    contact_email: string;
};

export type PublicBookingProductFilterOption = {
    id: string;
    name: string;
    description: string | null;
    bannerUrl: string | null;
};
