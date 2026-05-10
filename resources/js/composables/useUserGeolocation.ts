export type UserCoordinates = { lat: number; lng: number };

function tryGetCurrentPosition(highAccuracy: boolean): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            () => resolve(null),
            { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 60000 },
        );
    });
}

/**
 * Resolves the user's coordinates, preferring a precise (high-accuracy) reading
 * and falling back to an imprecise reading if the precise attempt is denied,
 * times out, or errors. Returns null when geolocation is unavailable or both
 * attempts fail.
 */
export function useUserGeolocation() {
    async function resolveUserCoordinates(): Promise<UserCoordinates | null> {
        const precise = await tryGetCurrentPosition(true);
        if (precise) {
            return { lat: precise.coords.latitude, lng: precise.coords.longitude };
        }
        const imprecise = await tryGetCurrentPosition(false);
        if (imprecise) {
            return { lat: imprecise.coords.latitude, lng: imprecise.coords.longitude };
        }
        return null;
    }

    return { resolveUserCoordinates };
}
