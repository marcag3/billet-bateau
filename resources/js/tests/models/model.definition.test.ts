import { expect, test } from 'vitest';
import { defineModel } from '../../models/model.definition';

function createApi() {
    return {
        create: async () => ({ txid: 1 }),
        update: async () => ({ txid: 2 }),
        remove: async () => ({ txid: 3 }),
    };
}

test('defineModel applies defaults', () => {
    const model = defineModel({
        name: 'widgets',
        collectionId: 'widgets',
        persistenceSchemaVersion: 1,
        api: createApi(),
    });

    expect(model.idKey).toBe('id');
    expect(model.orderBy).toEqual([]);
    expect(model.titleFromPayload({ title: 'Hello' })).toBe('Hello');
});

test('defineModel allows omitting api for PowerSync-only models', () => {
    const model = defineModel({
        name: 'widgets',
        collectionId: 'widgets',
        persistenceSchemaVersion: 1,
    });

    expect(model.name).toBe('widgets');
    expect(model.api).toBeUndefined();
});

test('defineModel validates required fields', () => {
    expect(() =>
        defineModel({
            name: '',
            collectionId: 'widgets',
            persistenceSchemaVersion: 1,
            api: createApi(),
        }),
    ).toThrow(/requires a non-empty "name"/);
});

test('defineModel requires persistenceSchemaVersion', () => {
    expect(() =>
        defineModel({
            name: 'widgets',
            collectionId: 'widgets',
            api: createApi(),
        }),
    ).toThrow(/persistenceSchemaVersion/);
});

test('defineModel rejects partial api contract', () => {
    expect(() =>
        defineModel({
            name: 'widgets',
            collectionId: 'widgets',
            persistenceSchemaVersion: 1,
            api: { create: async () => ({}) },
        }),
    ).toThrow(/api\.create\/api\.update\/api\.remove/);
});
