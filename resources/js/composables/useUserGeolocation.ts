export type UserCoordinates = { lat: number; lng: number };

function getCurrentPositionAsync(highAccuracy: boolean): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new Error('Geolocation API unavailable'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: 60000,
        });
    });
}

/**
 * Resolves the user's coordinates by racing a precise (high-accuracy / GPS)
 * request against an imprecise (network / Wi-Fi) request and taking whichever
 * fix returns first. Imprecise typically resolves sub-second while precise
 * waits for a GPS warm-up, so this avoids long delays without giving up the
 * chance of a precise fix when it happens to arrive first. Returns null when
 * geolocation is unavailable or both attempts fail.
 */
export function useUserGeolocation() {
    async function resolveUserCoordinates(): Promise<UserCoordinates | null> {
        try {
            const position = await Promise.any([
                getCurrentPositionAsync(true),
                getCurrentPositionAsync(false),
            ]);
            return { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch {
            return null;
        }
    }

    return { resolveUserCoordinates };
}
