export function createMutationEventEmitter() {
    /** @type {(event: Record<string, unknown>) => void | null} */
    let reporter = null;

    return {
        setReporter(nextReporter) {
            reporter = typeof nextReporter === 'function' ? nextReporter : null;
        },
        emit(event) {
            if (typeof reporter !== 'function') {
                return;
            }

            reporter(event);
        },
    };
}
