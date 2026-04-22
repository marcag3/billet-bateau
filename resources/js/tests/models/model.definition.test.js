import { expect, test } from 'vitest';
import { defineModel } from '../../models/model.definition.js';

function createApi() {
    return {
        create: async () => ({ txid: 1 }),
        update: async () => ({ txid: 2 }),
        remove: async () => ({ txid: 3 }),
    };
}

test('defineModel applies defaults', () => {
    const model = defineModel({
        name: 'todos',
        collectionId: 'todos',
        shapeUrl: '/api/shapes/todos',
        api: createApi(),
    });

    expect(model.idKey).toBe('id');
    expect(model.orderBy).toEqual([]);
    expect(model.titleFromPayload({ title: 'Hello' })).toBe('Hello');
});

test('defineModel validates required fields', () => {
    expect(() =>
        defineModel({
            name: '',
            collectionId: 'todos',
            shapeUrl: '/api/shapes/todos',
            api: createApi(),
        }),
    ).toThrow(/requires a non-empty "name"/);
});
