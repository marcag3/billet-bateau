import type { PowerSyncDatabase } from "@powersync/web";
import { watch } from "vue";
import {
    activeProgramIdRef,
    powerSyncDbRef,
    powerSyncConnectorConnected,
} from "./powersync-runtime-state";

let programScopeUnsubscribe: null | (() => void) = null;

let programScopeAttachSeq = 0;

let userScopeUnsubscribe: null | (() => void) = null;

function runStreamUnsubscribe(
    unsubscribe: (() => void) | null,
    label: string,
): void {
    if (!unsubscribe) {
        return;
    }

    try {
        unsubscribe();
    } catch (error) {
        console.warn(`PowerSync ${label} unsubscribe failed:`, error);
    }
}

function detachUserScopeStream(): void {
    const unsubscribe = userScopeUnsubscribe;
    userScopeUnsubscribe = null;
    runStreamUnsubscribe(unsubscribe, "user_scope");
}

/**
 * Subscribe to `user_scope` after `db.connect()` so stream timing matches the connector.
 */
export async function attachUserScopeStream(
    db: PowerSyncDatabase,
): Promise<void> {
    detachUserScopeStream();
    const sub = await db.syncStream("user_scope").subscribe();
    userScopeUnsubscribe = () => {
        sub.unsubscribe();
    };
}

/**
 * Subscribe to `program_scope` for the current active program (or tear down when none).
 * Safe to call repeatedly (e.g. after `db.connect()` when the router already set the program).
 */
export function attachProgramScopeStreamSubscription(): void {
    if (typeof window === "undefined") {
        return;
    }

    const unsubscribe = programScopeUnsubscribe;
    programScopeUnsubscribe = null;
    runStreamUnsubscribe(unsubscribe, "program_scope");

    const db = powerSyncDbRef.value;
    const newPid = activeProgramIdRef.value.trim();
    if (newPid.length === 0 || !db || !powerSyncConnectorConnected) {
        return;
    }

    const attachSeq = ++programScopeAttachSeq;

    void db
        .syncStream("program_scope", { program_id: newPid })
        .subscribe()
        .then((sub) => {
            if (attachSeq !== programScopeAttachSeq) {
                sub.unsubscribe();
                return;
            }

            programScopeUnsubscribe = () => {
                sub.unsubscribe();
            };
        })
        .catch((err) => {
            console.error("program_scope subscribe failed:", err);
        });
}

export function detachAllPowerSyncStreams(): void {
    const programUnsubscribe = programScopeUnsubscribe;
    programScopeUnsubscribe = null;
    runStreamUnsubscribe(programUnsubscribe, "program_scope");
    detachUserScopeStream();
}

export function registerProgramScopeStreamWatch(): void {
    if (typeof window === "undefined") {
        return;
    }
    watch(activeProgramIdRef, () => {
        attachProgramScopeStreamSubscription();
    });
}
