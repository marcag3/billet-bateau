export function belongsTo({ relationName, fromKey, targetModel, targetKey = 'id' }) {
    return {
        type: 'belongsTo',
        relationName,
        fromKey,
        targetModel,
        targetKey,
    };
}

export function hasMany({ relationName, fromKey = 'id', targetModel, targetKey }) {
    return {
        type: 'hasMany',
        relationName,
        fromKey,
        targetModel,
        targetKey,
    };
}

export function defineRelations(relations = []) {
    const map = {};

    for (const relation of relations) {
        if (!relation || typeof relation.relationName !== 'string' || relation.relationName.length === 0) {
            continue;
        }

        map[relation.relationName] = relation;
    }

    return map;
}
