import { useQuasar } from 'quasar';

export function getErrorMessageForNotify(error: unknown, genericMessage: string): string {
    return error instanceof Error ? error.message : genericMessage;
}

export function useNotifyErrorFromCatch() {
    const $q = useQuasar();

    function notifyError(error: unknown, genericMessage: string): void {
        $q.notify({
            type: 'negative',
            message: getErrorMessageForNotify(error, genericMessage),
        });
    }

    return { notifyError };
}
