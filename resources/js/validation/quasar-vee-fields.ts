import type { FormContext, GenericObject, Path } from 'vee-validate';
import type { MaybeRefOrGetter } from 'vue';

/**
 * Bind vee-validate `defineField` to Quasar input props (`error`, `errorMessage`).
 */
export function createQuasarFieldBinder<
    TValues extends GenericObject = GenericObject,
    TOutput extends GenericObject = TValues,
>(defineField: FormContext<TValues, TOutput>['defineField']) {
    return function quasarField<TPath extends Path<TValues>>(path: MaybeRefOrGetter<TPath>) {
        return defineField(path, (state) => ({
            props: {
                error: state.touched && state.errors.length > 0,
                errorMessage: state.errors[0] ?? '',
            },
        }));
    };
}
