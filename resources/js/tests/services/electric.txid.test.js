import { expect, test } from 'vitest';
import { awaitTxidReconciliation, requireTxid } from '../../services/electric.txid.js';

test('requireTxid parses numeric txid', () => {
    expect(requireTxid({ txid: '42' }, 'insert', 'todos')).toBe(42);
});

test('requireTxid throws on missing txid', () => {
    expect(() => requireTxid({}, 'update', 'todos')).toThrow(/Missing txid/);
});

test('awaitTxidReconciliation swallows await failures', async () => {
    await expect(
        awaitTxidReconciliation(async () => {
            throw new Error('stream lag');
        }, 123),
    ).resolves.toBeUndefined();
});
