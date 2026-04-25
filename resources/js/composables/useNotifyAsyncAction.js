import { useQuasar } from 'quasar';

/**
 * Run async work with success + error notifications (e.g. form submit, mutations).
 */
export function useNotifyAsyncAction() {
    const $q = useQuasar();

    /**
     * @param {() => Promise<unknown>} fn
     * @param {{ successMessage?: string, errorGeneric: string }} opts
     */
    async function runWithNotify(fn, opts) {
        try {
            const result = await fn();
            if (opts.successMessage) {
                $q.notify({ type: 'positive', message: opts.successMessage });
            }
            return result;
        } catch (error) {
            $q.notify({
                type: 'negative',
                message: error instanceof Error ? error.message : opts.errorGeneric,
            });
        }
    }

    return { runWithNotify };
}
