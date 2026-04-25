export function buildOutboxId(type, entityId) {
    return `${type}:${entityId}`;
}
