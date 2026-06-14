/**
 * Strip combining marks (accents) and fold common Latin specials for program URL slugs.
 */
export function foldUnicodeForProgramSlug(input: unknown): string {
    let s = String(input ?? '').trim();
    s = s.normalize('NFD').replace(/\p{M}/gu, '');
    s = s.replace(/\u00df/gi, 'ss').replace(/\u1e9e/g, 'ss');

    return s;
}
