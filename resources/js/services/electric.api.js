import shapes from '../routes/api/shapes';

/**
 * @param {keyof typeof shapes} shapeKey
 */
export function getElectricShapeUrlForShape(shapeKey = 'todos') {
    const shape = shapes[shapeKey];

    if (!shape || typeof shape.url !== 'function') {
        throw new Error(`[electric.api] Unknown Electric shape: ${String(shapeKey)}`);
    }

    const shapePath = shape.url(shapeKey);

    if (typeof window !== 'undefined' && window.location?.origin) {
        return new URL(shapePath, window.location.origin).toString();
    }

    return shapePath;
}

/** @deprecated Use {@link getElectricShapeUrlForShape} */
export function getElectricShapeUrl() {
    return getElectricShapeUrlForShape('todos');
}
