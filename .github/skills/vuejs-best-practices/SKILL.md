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

## Implementation checklist

Use this checklist before finalizing Vue changes:

- [ ] SFC names are multi-word and `PascalCase.vue`
- [ ] Route/store/service files follow suffix conventions
- [ ] Directives use shorthand syntax (`:`, `@`, `#`)
- [ ] Every `v-for` has a stable unique `:key`
- [ ] No `v-if` on the same element as `v-for`
- [ ] Props include clear type/required/default definitions
- [ ] Component-specific styles are scoped
