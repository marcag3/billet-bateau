export interface SlotFormState {
    departureTime: string;
    capacity: number | null;
    boatTypeId: string | null;
    waterRouteId: string | null;
    ticketPolicy: "defaults" | "custom";
    allowedTicketTypeIds: string[];
    minPerBooking: number | null;
    maxPerBooking: number | null;
    constraintNotes: string;
    internalNotes: string;
}

export function createEmptySlotForm(): SlotFormState {
    return {
        departureTime: "",
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
        ticketPolicy: "defaults",
        allowedTicketTypeIds: [],
        minPerBooking: 1,
        maxPerBooking: null,
        constraintNotes: "",
        internalNotes: "",
    };
}

export function parseTicketSetup(
    raw: string | null | undefined,
): Pick<
    SlotFormState,
    | "ticketPolicy"
    | "allowedTicketTypeIds"
    | "minPerBooking"
    | "maxPerBooking"
    | "constraintNotes"
> {
    if (raw == null) {
        return {
            ticketPolicy: "defaults",
            allowedTicketTypeIds: [],
            minPerBooking: 1,
            maxPerBooking: null,
            constraintNotes: "",
        };
    }
    try {
        const parsed = JSON.parse(raw) as {
            policy?: "defaults" | "custom";
            allowed_ticket_type_ids?: string[];
            min_per_booking?: number | null;
            max_per_booking?: number | null;
            notes?: string;
        };
        if (parsed.policy === "custom") {
            return {
                ticketPolicy: "custom",
                allowedTicketTypeIds: parsed.allowed_ticket_type_ids ?? [],
                minPerBooking: parsed.min_per_booking ?? 1,
                maxPerBooking: parsed.max_per_booking ?? null,
                constraintNotes: parsed.notes ?? "",
            };
        }
    } catch {
        // ignore parse errors, fall back to defaults
    }
    return {
        ticketPolicy: "defaults",
        allowedTicketTypeIds: [],
        minPerBooking: 1,
        maxPerBooking: null,
        constraintNotes: "",
    };
}

export function serializeTicketSetup(form: SlotFormState): string | null {
    if (form.ticketPolicy !== "custom") {
        return null;
    }
    return JSON.stringify({
        policy: "custom",
        allowed_ticket_type_ids: form.allowedTicketTypeIds,
        min_per_booking: form.minPerBooking ?? 1,
        max_per_booking: form.maxPerBooking ?? null,
        notes: form.constraintNotes.length > 0 ? form.constraintNotes : null,
    });
}
