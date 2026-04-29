import { column, Schema, Table } from '@powersync/web';

const programsTable = new Table({
    id: column.text,
    user_id: column.integer,
    address_id: column.text,
    name: column.text,
    description: column.text,
    theme_color: column.text,
    is_active: column.integer,
    is_archived: column.integer,
    slug: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const addressesTable = new Table({
    id: column.text,
    program_id: column.text,
    line_1: column.text,
    line_2: column.text,
    city: column.text,
    postal_code: column.text,
    country: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const boatTypesTable = new Table({
    user_id: column.integer,
    program_id: column.text,
    name: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const boatsTable = new Table({
    user_id: column.integer,
    boat_type_id: column.text,
    name: column.text,
    capacity: column.integer,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const boatProgramTable = new Table({
    boat_id: column.text,
    program_id: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const tripsTable = new Table({
    program_id: column.text,
    boat_type_id: column.text,
    water_route_id: column.text,
    template_day_slot_id: column.text,
    scheduled_departure_at: column.text,
    capacity: column.integer,
    created_at: column.text,
    updated_at: column.text,
});

const waterRoutesTable = new Table({
    id: column.text,
    program_id: column.text,
    name: column.text,
    trace: column.text,
    duration_minutes: column.integer,
    created_at: column.text,
    updated_at: column.text,
});

const templateDaysTable = new Table({
    id: column.text,
    program_id: column.text,
    name: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const templateDaySlotsTable = new Table({
    id: column.text,
    template_day_id: column.text,
    sort_order: column.integer,
    departure_time: column.text,
    capacity: column.integer,
    boat_type_id: column.text,
    water_route_id: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const templateDayDatesTable = new Table({
    id: column.text,
    program_id: column.text,
    template_day_id: column.text,
    service_date: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const mediaTable = new Table({
    id: column.integer,
    program_id: column.text,
    model_type: column.text,
    model_id: column.text,
    uuid: column.text,
    collection_name: column.text,
    name: column.text,
    file_name: column.text,
    mime_type: column.text,
    disk: column.text,
    conversions_disk: column.text,
    size: column.integer,
    manipulations: column.text,
    custom_properties: column.text,
    generated_conversions: column.text,
    responsive_images: column.text,
    order_column: column.integer,
    created_at: column.text,
    updated_at: column.text,
});

export const appPowerSyncSchema = new Schema({
    programs: programsTable,
    addresses: addressesTable,
    boat_types: boatTypesTable,
    boats: boatsTable,
    boat_program: boatProgramTable,
    trips: tripsTable,
    water_routes: waterRoutesTable,
    template_days: templateDaysTable,
    template_day_slots: templateDaySlotsTable,
    template_day_dates: templateDayDatesTable,
    media: mediaTable,
});

/** @type {import('@powersync/web').Table} */
export const appProgramsPowerSyncTable = appPowerSyncSchema.props.programs;

/** @type {import('@powersync/web').Table} */
export const appAddressesPowerSyncTable = appPowerSyncSchema.props.addresses;

/** @type {import('@powersync/web').Table} */
export const appBoatTypesPowerSyncTable = appPowerSyncSchema.props.boat_types;

/** @type {import('@powersync/web').Table} */
export const appBoatsPowerSyncTable = appPowerSyncSchema.props.boats;

/** @type {import('@powersync/web').Table} */
export const appBoatProgramPowerSyncTable = appPowerSyncSchema.props.boat_program;

/** @type {import('@powersync/web').Table} */
export const appTripsPowerSyncTable = appPowerSyncSchema.props.trips;

/** @type {import('@powersync/web').Table} */
export const appWaterRoutesPowerSyncTable = appPowerSyncSchema.props.water_routes;

/** @type {import('@powersync/web').Table} */
export const appTemplateDaysPowerSyncTable = appPowerSyncSchema.props.template_days;

/** @type {import('@powersync/web').Table} */
export const appTemplateDaySlotsPowerSyncTable = appPowerSyncSchema.props.template_day_slots;

/** @type {import('@powersync/web').Table} */
export const appTemplateDayDatesPowerSyncTable = appPowerSyncSchema.props.template_day_dates;

/** @type {import('@powersync/web').Table} */
export const appMediaPowerSyncTable = appPowerSyncSchema.props.media;
