export function requireTxid(response, mutationType, scope = 'sync') {
    if (response?.txid === undefined || response.txid === null) {
        throw new Error(`[${scope}] Missing txid from ${mutationType} response.`);
    }

    const txid = Number(response.txid);

    if (!Number.isFinite(txid)) {
        throw new Error(`[${scope}] Invalid txid from ${mutationType} response.`);
    }

    return txid;
}

export async function awaitTxidReconciliation(awaitTxid, txid, timeoutMs = 15000) {
    try {
        await awaitTxid(txid, timeoutMs);
    } catch {
        // The write is durable once the API accepted it; the stream can catch up later.
    }
}
