import { column, Schema, Table } from '@powersync/web';

const programsTable = new Table({
    user_id: column.integer,
    address_id: column.text,
    name: column.text,
    description: column.text,
    theme_color: column.text,
    is_active: column.integer,
    slug: column.text,
    created_at: column.text,
    updated_at: column.text,
});

const addressesTable = new Table({
    id: column.text,
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

const mediaTable = new Table({
    id: column.integer,
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
export const appMediaPowerSyncTable = appPowerSyncSchema.props.media;
