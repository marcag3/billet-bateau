import { getMediaCollectionRef } from '../../powersync/app-powersync.runtime.js';

/**
 * @returns {import('vue').ShallowRef<import('@tanstack/db').Collection<unknown> | null>}
 */
export function getProgramMediaCollectionRef() {
    return getMediaCollectionRef();
}
