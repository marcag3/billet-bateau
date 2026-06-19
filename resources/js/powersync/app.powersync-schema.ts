import { column, Schema, Table } from '@powersync/web';

const programsTable = new Table({
    id: column.text,
    name: column.text,
    description: column.text,
    theme_color: column.text,
    is_active: column.integer,
    slug: column.text,
    booking_questions: column.text,
    email_signature: column.text,
    start_date: column.text,
    end_date: column.text,
    line_1: column.text,
    line_2: column.text,
    city: column.text,
    postal_code: column.text,
    country: column.text,
    banner_object_key: column.text,
    banner_mime_type: column.text,
    banner_size_bytes: column.integer,
    banner_etag: column.text,
    banner_uploaded_at: column.text,
});

const programUserTable = new Table({
    id: column.text,
    program_id: column.text,
    user_id: column.text,
    role: column.text,
});

const boatTypesTable = new Table({
    id: column.text,
    program_id: column.text,
    name: column.text,
    banner_object_key: column.text,
    banner_mime_type: column.text,
    banner_size_bytes: column.integer,
    banner_etag: column.text,
    banner_uploaded_at: column.text,
});

const boatsTable = new Table({
    id: column.text,
    boat_type_id: column.text,
    program_id: column.text,
    name: column.text,
    capacity: column.integer,
    notes: column.text,
});

const productsTable = new Table({
    id: column.text,
    program_id: column.text,
    boat_type_id: column.text,
    water_route_id: column.text,
    capacity: column.integer,
    name: column.text,
    description: column.text,
    banner_object_key: column.text,
    banner_mime_type: column.text,
    banner_size_bytes: column.integer,
    banner_etag: column.text,
    banner_uploaded_at: column.text,
});

const tripsTable = new Table({
    id: column.text,
    program_id: column.text,
    product_id: column.text,
    scheduled_departure_at: column.text,
});

const ticketTypesTable = new Table({
    id: column.text,
    program_id: column.text,
    title: column.text,
    price_cents: column.integer,
    is_pay_what_you_can: column.integer,
    min_per_purchase: column.integer,
    max_per_purchase: column.integer,
    depends_on_ticket_type_id: column.text,
    max_per_reference_ticket: column.integer,
});

const bookingTicketsTable = new Table({
    id: column.text,
    booking_id: column.text,
    ticket_type_id: column.text,
    name: column.text,
    email: column.text,
    country: column.text,
    custom_fields: column.text,
    waiver_confirmation_id: column.text,
});

const bookingsTable = new Table({
    id: column.text,
    program_id: column.text,
    trip_id: column.text,
    contact_name: column.text,
    contact_email: column.text,
});

const waterRoutesTable = new Table({
    id: column.text,
    program_id: column.text,
    name: column.text,
    trace: column.text,
    duration_minutes: column.integer,
});

const templateDaysTable = new Table({
    id: column.text,
    program_id: column.text,
    name: column.text,
});

const templateDaySlotsTable = new Table({
    id: column.text,
    template_day_id: column.text,
    sort_order: column.integer,
    departure_time: column.text,
    capacity: column.integer,
    boat_type_id: column.text,
    water_route_id: column.text,
    internal_notes: column.text,
    ticket_setup: column.text,
});

const templateDayDatesTable = new Table({
    id: column.text,
    program_id: column.text,
    template_day_id: column.text,
    service_date: column.text,
});

const guidesTable = new Table({
    id: column.text,
    name: column.text,
    staff_user_id: column.text,
});

const voyagesTable = new Table({
    id: column.text,
    program_id: column.text,
    user_id: column.text,
    trip_id: column.text,
    water_route_id: column.text,
    scheduled_departure_at: column.text,
    started_at: column.text,
    arrived_at: column.text,
    status: column.text,
});

const passengersTable = new Table({
    id: column.text,
    voyage_id: column.text,
    name: column.text,
    booking_id: column.text,
    check_in_id: column.text,
    notes: column.text,
});

const checkInsTable = new Table({
    id: column.text,
    booking_id: column.text,
    voyage_id: column.text,
    notes: column.text,
});

const voyageBoatTable = new Table({
    id: column.text,
    voyage_id: column.text,
    boat_id: column.text,
});

const voyageGuideTable = new Table({
    id: column.text,
    voyage_id: column.text,
    guide_id: column.text,
});

export const appPowerSyncSchema = new Schema({
    programs: programsTable,
    program_user: programUserTable,
    boat_types: boatTypesTable,
    boats: boatsTable,
    products: productsTable,
    trips: tripsTable,
    ticket_types: ticketTypesTable,
    bookings: bookingsTable,
    booking_tickets: bookingTicketsTable,
    water_routes: waterRoutesTable,
    template_days: templateDaysTable,
    template_day_slots: templateDaySlotsTable,
    template_day_dates: templateDayDatesTable,
    guides: guidesTable,
    voyages: voyagesTable,
    passengers: passengersTable,
    check_ins: checkInsTable,
    voyage_boat: voyageBoatTable,
    voyage_guide: voyageGuideTable,
});

/** @type {import('@powersync/web').Table} */
export const appProgramsPowerSyncTable = appPowerSyncSchema.props.programs;

/** @type {import('@powersync/web').Table} */
export const appProgramUserPowerSyncTable = appPowerSyncSchema.props.program_user;

/** @type {import('@powersync/web').Table} */
export const appBoatTypesPowerSyncTable = appPowerSyncSchema.props.boat_types;

/** @type {import('@powersync/web').Table} */
export const appBoatsPowerSyncTable = appPowerSyncSchema.props.boats;

/** @type {import('@powersync/web').Table} */
export const appProductsPowerSyncTable = appPowerSyncSchema.props.products;

/** @type {import('@powersync/web').Table} */
export const appTripsPowerSyncTable = appPowerSyncSchema.props.trips;

/** @type {import('@powersync/web').Table} */
export const appTicketTypesPowerSyncTable = appPowerSyncSchema.props.ticket_types;

/** @type {import('@powersync/web').Table} */
export const appBookingsPowerSyncTable = appPowerSyncSchema.props.bookings;

/** @type {import('@powersync/web').Table} */
export const appBookingTicketsPowerSyncTable = appPowerSyncSchema.props.booking_tickets;

/** @type {import('@powersync/web').Table} */
export const appWaterRoutesPowerSyncTable = appPowerSyncSchema.props.water_routes;

/** @type {import('@powersync/web').Table} */
export const appTemplateDaysPowerSyncTable = appPowerSyncSchema.props.template_days;

/** @type {import('@powersync/web').Table} */
export const appTemplateDaySlotsPowerSyncTable = appPowerSyncSchema.props.template_day_slots;

/** @type {import('@powersync/web').Table} */
export const appTemplateDayDatesPowerSyncTable = appPowerSyncSchema.props.template_day_dates;

/** @type {import('@powersync/web').Table} */
export const appGuidesPowerSyncTable = appPowerSyncSchema.props.guides;

/** @type {import('@powersync/web').Table} */
export const appVoyagesPowerSyncTable = appPowerSyncSchema.props.voyages;

/** @type {import('@powersync/web').Table} */
export const appPassengersPowerSyncTable = appPowerSyncSchema.props.passengers;

/** @type {import('@powersync/web').Table} */
export const appCheckInsPowerSyncTable = appPowerSyncSchema.props.check_ins;

/** @type {import('@powersync/web').Table} */
export const appVoyageBoatPowerSyncTable = appPowerSyncSchema.props.voyage_boat;

/** @type {import('@powersync/web').Table} */
export const appVoyageGuidePowerSyncTable = appPowerSyncSchema.props.voyage_guide;
