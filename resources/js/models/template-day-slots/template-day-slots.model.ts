import { ulid } from "ulid";
import {
    getTemplateDaySlotsCollection,
    refreshOutboxSnapshot,
} from "../../powersync/app-powersync.runtime";

export interface CreateTemplateDaySlotParams {
    templateDayId: string;
    sortOrder: number;
    departureTime: string;
    capacity: number;
    boatTypeId: string | null;
    waterRouteId: string | null;
    ticketSetup: string | null;
    internalNotes: string | null;
}

export interface PatchTemplateDaySlotParams {
    departureTime?: string;
    capacity?: number;
    boatTypeId?: string | null;
    waterRouteId?: string | null;
    ticketSetup?: string | null;
    internalNotes?: string | null;
    sortOrder?: number;
}

/**
 * Insert a new template day slot row into the local PowerSync collection.
 */
export async function createTemplateDaySlotRow(
    params: CreateTemplateDaySlotParams,
): Promise<string> {
    const col = getTemplateDaySlotsCollection().value;
    if (!col) {
        throw new Error("Template day slots collection not ready.");
    }
    const id = ulid();
    await col
        .insert({
            id,
            template_day_id: params.templateDayId,
            sort_order: params.sortOrder,
            departure_time: params.departureTime,
            capacity: params.capacity,
            boat_type_id: params.boatTypeId,
            water_route_id: params.waterRouteId,
            ticket_setup: params.ticketSetup,
            internal_notes: params.internalNotes,
        })
        .isPersisted.promise;
    void refreshOutboxSnapshot();
    return id;
}

/**
 * Update an existing template day slot row.
 */
export async function patchTemplateDaySlotRow(
    id: string,
    params: PatchTemplateDaySlotParams,
): Promise<void> {
    const col = getTemplateDaySlotsCollection().value;
    if (!col) {
        throw new Error("Template day slots collection not ready.");
    }
    await col
        .update(id, (draft) => {
            if (params.departureTime !== undefined) {
                draft.departure_time = params.departureTime;
            }
            if (params.capacity !== undefined) {
                draft.capacity = params.capacity;
            }
            if (params.boatTypeId !== undefined) {
                draft.boat_type_id = params.boatTypeId;
            }
            if (params.waterRouteId !== undefined) {
                draft.water_route_id = params.waterRouteId;
            }
            if (params.ticketSetup !== undefined) {
                draft.ticket_setup = params.ticketSetup;
            }
            if (params.internalNotes !== undefined) {
                draft.internal_notes = params.internalNotes;
            }
            if (params.sortOrder !== undefined) {
                draft.sort_order = params.sortOrder;
            }
        })
        .isPersisted.promise;
    void refreshOutboxSnapshot();
}

/**
 * Delete a template day slot row.
 */
export async function deleteTemplateDaySlotRow(id: string): Promise<void> {
    const col = getTemplateDaySlotsCollection().value;
    if (!col) {
        throw new Error("Template day slots collection not ready.");
    }
    await col.delete(id).isPersisted.promise;
    void refreshOutboxSnapshot();
}
