2. Eager Sync Mode for All 11 Collections
Every collection uses the default eager sync mode. After bootstrap, all 11 collections are preload()ed (lines 337–342):


app-powersync.runtime.ts
Lines 337-342
await Promise.all(
    Object.values(collectionRefs)
        .map((r) => r.value)
        .filter(Boolean)
        .map((c) => c.preload()),
);
This loads every row from every table into in-memory TanStack DB collections at boot time. As shown in the docs, on-demand mode would only load rows that satisfy the active live queries' predicates into memory. For a PWA with potentially thousands of rows across 11 tables (media entries, trips, template dates, etc.), this is wasteful and will degrade as data grows.

No collection has a .where() clause in its live query (see entity.queries.ts line 43 — from({ [alias]: resolvedCollection }) with no filter). Each live query fetches the entire collection into the Vue reactive system.

3. PowerSync Stream Subscriptions Are Decoupled from Collection Lifecycle
The docs show a proper pattern using onLoad and onLoadSubset hooks to tie Sync Stream subscriptions to collection data needs. This app takes a different approach — user_scope and program_scope streams are subscribed and unsubscribed manually via standalone functions:


app-powersync.runtime.ts
Lines 172-206
async function resyncUserScopeSubscription() {
    // ...
    userScopeSubscription = await db.syncStream('user_scope').subscribe();
}
async function resyncProgramScopeSubscription() {
    // ...
    programScopeSubscription = await db.syncStream('program_scope', { program_id: pid }).subscribe();
}
This has several downsides:

Streams keep syncing data to SQLite even when no TanStack DB collection is being queried.
No cleanup when a collection is no longer needed — the stream runs until unsubscribe() is explicitly called (which currently never happens for user_scope, and for program_scope only when setProgramSyncScopeId is called).
The collections have no awareness of how their underlying data is populated. The onLoadSubset hook (shown in Examples 4–6 of the docs) would allow a collection to dynamically subscribe/unsubscribe based on active live queries.
4. No TanStack DB Relations
The defineRelations system is a custom abstraction (storing empty maps) that has no connection to TanStack DB. The docs show that TanStack DB collections support rich joins, but this app performs all relation-like lookups in Vue code — e.g., programs.value.find(p => p.id === x). This is an N+1 pattern waiting to happen, and it means queries don't benefit from TanStack DB's reactive join machinery.


I'd like to subscribe to one program at a time, the latest openned.
