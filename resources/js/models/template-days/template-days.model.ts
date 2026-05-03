import { ulid } from "ulid";
import {
    getActiveProgramIdRef,
    getTemplateDaysCollection,
    refreshOutboxSnapshot,
} from "../../powersync/app-powersync.runtime";

export interface CreateTemplateDayParams {
    name: string;
}

/**
 * Insert a new template day row into the local PowerSync collection.
 * The name defaults to "Untitled" if blank (matching the backend model).
 */
export async function createTemplateDayRow(
    params: CreateTemplateDayParams,
): Promise<string> {
    const col = getTemplateDaysCollection().value;
    if (!col) {
        throw new Error("Template days collection not ready.");
    }
    const pid = getActiveProgramIdRef().value.trim();
    if (pid.length === 0) {
        throw new Error("Select a program before adding template days.");
    }
    const id = ulid();
    await col.insert({
        id,
        program_id: pid,
        name: params.name.trim().length > 0 ? params.name.trim() : "Untitled",
    }).isPersisted.promise;
    void refreshOutboxSnapshot();
    return id;
}
