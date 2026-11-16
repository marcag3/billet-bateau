---
name: vuejs-best-practices
description: Enforces Vue 3 naming, Single File Component structure, template directives, and file organization conventions. Use when creating, editing, reviewing, or refactoring Vue components, Vue router modules, Pinia-style stores, or frontend service modules.
---

# Vue.js Best Practices

## When to apply

Apply this skill for Vue frontend work, especially when:
- naming or moving Vue files
- creating or reviewing SFC components
- editing templates, props, loops, directives, or scoped styles
- adding routes, stores, or service modules

## Naming and file organization

- Use `PascalCase.vue` for all Vue SFC files (example: `AppDashboardPage.vue`).
- Use multi-word component names; avoid single-word component names.
- Keep folder names plural: `components`, `layouts`, `pages`, `services`, `utilities`.
- Keep JS module suffixes consistent and predictable:
  - routes: `*.routes.js`
  - stores: `*.store.js`
  - services: `*.api.js`, `*.client.js`, `*.sync.js`
  - generic modules: use one style consistently within a feature area (`kebab-case.js` or dot-suffix style like `auth.store.js`)

## Component naming patterns

- Base/presentational components should use a shared prefix: `Base`, `App`, or `V`.
- Tightly coupled child components should include the parent name as a prefix.
  - Example: `TodoListItemActions.vue` for a child used only by `TodoListItem.vue`.
- Order component name words from broad to specific.
  - Prefer `SearchButtonClear.vue` over `ClearSearchButton.vue`.

## Template and props rules

- Define props in detail with `type`, `required`, and `default` where appropriate.
- Always include a stable `:key` on `v-for`.
- Do not place `v-if` and `v-for` on the same element; move filtering to computed state.
- Use directive shorthands:
  - `:` instead of `v-bind:`
  - `@` instead of `v-on:`
  - `#` instead of `v-slot:`

## Styling rules

- Use component-scoped styles for component-specific styling.
- Keep global styles for truly global concerns only (reset, theme tokens, typography system).

## Forms (vee-validate v4 + Quasar)

- Use **`useForm`**, **`defineField`**, and **`handleSubmit`** from `vee-validate` (v4 composables). Do not add new `ValidationObserver` / `ValidationProvider` usage.
- Co-locate Zod schemas and value types in `resources/js/models/<feature>/*.validation.ts` and expose typed schemas with `@vee-validate/zod` (`toTypedSchema`).
- Bind Quasar field props with **`createQuasarFieldBinder(defineField)`** from `resources/js/validation/quasar-vee-fields.ts` so `error` / `errorMessage` stay consistent with vee-validate state.
- Prefer **`<q-form @submit="onSubmit">`** where `onSubmit` is the `handleSubmit` callback. Avoid **`@submit.prevent`** on the same handler if you also call **`QForm`’s programmatic `submit(evt)`** (e.g. in tests): Quasar may emit `submit` with `undefined`, and Vue’s `.prevent` wrapper expects an event object.
- Use a **primary `type="submit"`** button inside the form; avoid ad-hoc `@keydown.enter` submit wiring on individual inputs.
- When `validateOnMount` is used, re-sync validation after prop-driven `resetForm` / `setValues` if field `meta` must match server-provided values (e.g. watch props then `await nextTick()` + `await validate()` when needed).

## Implementation checklist

Use this checklist before finalizing Vue changes:

- [ ] SFC names are multi-word and `PascalCase.vue`
- [ ] Route/store/service files follow suffix conventions
- [ ] Directives use shorthand syntax (`:`, `@`, `#`)
- [ ] Every `v-for` has a stable unique `:key`
- [ ] No `v-if` on the same element as `v-for`
- [ ] Props include clear type/required/default definitions
- [ ] Component-specific styles are scoped
- [ ] New or refactored forms follow **Forms (vee-validate v4 + Quasar)** above; keep `.cursor` and `.github` copies of this skill in sync when editing either
