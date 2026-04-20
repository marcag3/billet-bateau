import { todos as todosShape } from '../routes/api/shapes';

export function getElectricShapeUrl() {
    const shapePath = todosShape.url();

    if (typeof window !== 'undefined' && window.location?.origin) {
        return new URL(shapePath, window.location.origin).toString();
    }

    return shapePath;
}
