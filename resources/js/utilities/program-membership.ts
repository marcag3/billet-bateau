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
