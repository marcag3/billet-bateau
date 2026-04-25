/**
 * Bind vee-validate `defineField` to Quasar input props (`error`, `errorMessage`).
 *
 * @param {import('vee-validate').UseFormReturn<any>['defineField']} defineField
 * from `useForm(...)`
 */
export function createQuasarFieldBinder(defineField) {
    return (path) =>
        defineField(path, (state) => ({
            props: {
                error: state.touched && state.errors.length > 0,
                errorMessage: state.errors[0] ?? '',
            },
        }));
}
