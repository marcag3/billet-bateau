import { useQuasar } from 'quasar';

export type NotifyAsyncActionOptions = {
    successMessage?: string;
    errorGeneric: string;
};

/**
 * Run async work with success + error notifications (e.g. form submit, mutations).
 */
export function useNotifyAsyncAction() {
    const $q = useQuasar();

    async function runWithNotify<T>(
        fn: () => Promise<T>,
        opts: NotifyAsyncActionOptions,
    ): Promise<T | undefined> {
        try {
            const result = await fn();
            if (opts.successMessage) {
                $q.notify({ type: 'positive', message: opts.successMessage });
            }
            return result;
        } catch (error: unknown) {
            $q.notify({
                type: 'negative',
                message: error instanceof Error ? error.message : opts.errorGeneric,
            });
        }
    }

    return { runWithNotify };
}
