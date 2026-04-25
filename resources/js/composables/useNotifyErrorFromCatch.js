import { useQuasar } from 'quasar';

/**
 * @param {unknown} error
 * @param {string} genericMessage
 */
export function getErrorMessageForNotify(error, genericMessage) {
    return error instanceof Error ? error.message : genericMessage;
}

export function useNotifyErrorFromCatch() {
    const $q = useQuasar();

    function notifyError(error, genericMessage) {
        $q.notify({
            type: 'negative',
            message: getErrorMessageForNotify(error, genericMessage),
        });
    }

    return { notifyError };
}
