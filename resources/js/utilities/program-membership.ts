export type ProgramMembershipRow = {
    program_id?: string | null;
    user_id?: string | null;
    role?: string | null;
};

export function resolveCurrentProgramMembershipRole(
    memberships: readonly ProgramMembershipRow[],
    programId: string,
    userId: string,
): string | null {
    const normalizedProgramId = programId.trim();
    const normalizedUserId = userId.trim();
    if (normalizedProgramId.length === 0 || normalizedUserId.length === 0) {
        return null;
    }

    const row = memberships.find(
        (membership) =>
            String(membership.program_id ?? "") === normalizedProgramId &&
            String(membership.user_id ?? "") === normalizedUserId,
    );

    return row?.role ?? null;
}

export function isProgramOwner(
    membershipRole: string | null | undefined,
): boolean {
    return membershipRole === "owner";
}

export function canInviteProgramAdmins(
    membershipRole: string | null | undefined,
): boolean {
    return isProgramOwner(membershipRole);
}
