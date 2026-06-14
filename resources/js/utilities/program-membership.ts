export function canInviteProgramAdmins(
    membershipRole: string | null | undefined,
): boolean {
    return membershipRole === "owner";
}
