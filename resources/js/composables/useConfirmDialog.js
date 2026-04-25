import { useQuasar } from 'quasar';

export function useConfirmDialog() {
    const $q = useQuasar();

    /**
     * @param {{ title: string, message: string, onOk: () => void | Promise<void> }} options
     */
    function confirm(options) {
        $q.dialog({
            title: options.title,
            message: options.message,
            cancel: true,
            persistent: true,
        }).onOk(() => {
            void Promise.resolve(options.onOk());
        });
    }

    return { confirm };
}
