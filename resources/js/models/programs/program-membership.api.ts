import {
    destroyInvitation,
    destroyMember,
    index,
    transferOwnership,
} from "../../actions/App/Http/Controllers/Api/ProgramMembershipController";
import {
    buildJsonHeaders,
    fetchWith419Retry,
    getCsrfHeaders,
    parseJsonPayload,
} from "../../services/http.client";
import { translate } from "../../utilities/i18n";
import { ensureSanctumCsrfCookie } from "./program-invitations.api";

export type ProgramMember = {
    user_id: string;
    name: string;
    email: string;
    role: string;
};

export type ProgramPendingInvitation = {
    id: string;
    email: string;
    expires_at: string;
    created_at: string;
};

export type ProgramMembership = {
    members: ProgramMember[];
    pending_invitations: ProgramPendingInvitation[];
};

function authJsonHeaders(): Record<string, string> {
    return buildJsonHeaders(
        {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...getCsrfHeaders(),
        },
        { includeRequestedWith: true },
    );
}

function parseApiError(
    payload: unknown,
    fallbackKey: string,
    field?: string,
): string {
    const errors = (payload as { errors?: Record<string, string[]> }).errors;
    if (field && errors?.[field]?.[0]) {
        return String(errors[field][0]);
    }
    const message = (payload as { message?: unknown }).message;
    if (message != null && String(message).length > 0) {
        return String(message);
    }
    return translate(fallbackKey);
}

export async function fetchProgramMembership(
    programId: string,
): Promise<ProgramMembership> {
    await ensureSanctumCsrfCookie();

    const response = await fetchWith419Retry(index.url(programId), {
        method: "GET",
        headers: authJsonHeaders(),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        throw new Error(
            parseApiError(payload, "programsMembers.loadFailed"),
        );
    }

    const data = (payload as { data?: ProgramMembership }).data;
    if (data == null) {
        throw new Error(translate("programsMembers.loadFailed"));
    }

    return data;
}

export async function removeProgramMember(
    programId: string,
    userId: string,
): Promise<void> {
    await ensureSanctumCsrfCookie();

    const response = await fetchWith419Retry(
        destroyMember.url({ programId, userId }),
        {
            method: "DELETE",
            headers: authJsonHeaders(),
        },
    );

    if (response.status === 204) {
        return;
    }

    const payload = await parseJsonPayload(response);
    throw new Error(
        parseApiError(payload, "programsMembers.removeFailed"),
    );
}

export async function revokeProgramInvitation(
    programId: string,
    invitationId: string,
): Promise<void> {
    await ensureSanctumCsrfCookie();

    const response = await fetchWith419Retry(
        destroyInvitation.url({ programId, invitationId }),
        {
            method: "DELETE",
            headers: authJsonHeaders(),
        },
    );

    if (response.status === 204) {
        return;
    }

    const payload = await parseJsonPayload(response);
    throw new Error(
        parseApiError(payload, "programsMembers.revokeInviteFailed", "invitation"),
    );
}

export async function transferProgramOwnership(
    programId: string,
    userId: string,
): Promise<void> {
    await ensureSanctumCsrfCookie();

    const response = await fetchWith419Retry(transferOwnership.url(programId), {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ user_id: userId }),
    });

    if (response.status === 204) {
        return;
    }

    const payload = await parseJsonPayload(response);
    throw new Error(
        parseApiError(payload, "programsMembers.transferFailed"),
    );
}
