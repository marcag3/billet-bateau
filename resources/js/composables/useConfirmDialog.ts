import { useQuasar } from 'quasar';

export type ConfirmDialogOptions = {
    title: string;
    message: string;
    onOk: () => void | Promise<void>;
};

export function useConfirmDialog() {
    const $q = useQuasar();

    function confirm(options: ConfirmDialogOptions): void {
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
