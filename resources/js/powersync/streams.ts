import type { PowerSyncDatabase } from "@powersync/web";
import { watch } from "vue";
import {
    activeProgramIdRef,
    powerSyncDbRef,
    powerSyncConnectorConnected,
} from "./powersync-runtime-state";

let programScopeUnsubscribe: null | (() => void) = null;

let userScopeUnsubscribe: null | (() => void) = null;

function detachUserScopeStream(): void {
    if (userScopeUnsubscribe) {
        try {
            userScopeUnsubscribe();
        } catch (error) {
            console.warn("PowerSync user_scope unsubscribe failed:", error);
        }
        userScopeUnsubscribe = null;
    }
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

    if (programScopeUnsubscribe) {
        try {
            programScopeUnsubscribe();
        } catch (error) {
            console.warn("PowerSync program_scope unsubscribe failed:", error);
        }
        programScopeUnsubscribe = null;
    }

    const db = powerSyncDbRef.value;
    const newPid = activeProgramIdRef.value.trim();
    if (newPid.length === 0 || !db || !powerSyncConnectorConnected) {
        return;
    }

    void db
        .syncStream("program_scope", { program_id: newPid })
        .subscribe()
        .then((sub) => {
            programScopeUnsubscribe = () => {
                sub.unsubscribe();
            };
        })
        .catch((err) => {
            console.error("program_scope subscribe failed:", err);
        });
}

export function detachAllPowerSyncStreams(): void {
    if (programScopeUnsubscribe) {
        try {
            programScopeUnsubscribe();
        } catch (error) {
            console.warn(
                "PowerSync program_scope unsubscribe failed during detach:",
                error,
            );
        }
        programScopeUnsubscribe = null;
    }
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
