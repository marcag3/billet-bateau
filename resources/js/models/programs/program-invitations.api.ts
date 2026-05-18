import { eligibility, store } from "../../actions/App/Http/Controllers/Api/ProgramInvitationController";
import { csrfCookie } from "../../routes/sanctum";
import {
    buildJsonHeaders,
    fetchWith419Retry,
    getCsrfHeaders,
    parseJsonPayload,
} from "../../services/http.client";
import { translate } from "../../utilities/i18n";

export async function ensureSanctumCsrfCookie(): Promise<void> {
    const response = await fetch(csrfCookie.url(), {
        method: "GET",
        credentials: "same-origin",
        headers: buildJsonHeaders({}, { includeRequestedWith: true }),
    });

    if (!response.ok) {
        throw new Error(translate("auth.unableInitCsrf"));
    }
}

export async function fetchInvitationEligibility(
    programId: string,
): Promise<{ can_invite_admins: boolean }> {
    const response = await fetch(eligibility.url(programId), {
        method: "GET",
        credentials: "same-origin",
        headers: buildJsonHeaders(
            {
                "Cache-Control": "no-cache",
            },
            { includeRequestedWith: true },
        ),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const message = String(
            (payload as { message?: unknown }).message ??
                translate("programsInvite.loadEligibilityFailed"),
        );
        throw new Error(message);
    }

    const data = (payload as { data?: { can_invite_admins?: boolean } }).data;

    return {
        can_invite_admins: Boolean(data?.can_invite_admins),
    };
}

export async function sendProgramAdminInvitation(
    programId: string,
    email: string,
): Promise<void> {
    await ensureSanctumCsrfCookie();

    const response = await fetchWith419Retry(store.url(programId), {
        method: "POST",
        headers: buildJsonHeaders(
            {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({ email }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const errors = (payload as { errors?: Record<string, string[]> }).errors;
        const first =
            errors?.email?.[0] ??
            (payload as { message?: unknown }).message ??
            translate("programsInvite.acceptFailed");
        throw new Error(String(first));
    }
}
