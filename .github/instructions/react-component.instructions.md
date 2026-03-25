---
description: "Use when writing React components, hooks, or pages in the web app. Covers component structure, hooks patterns, API client usage, and styling conventions."
applyTo: "apps/web/src/**/*.tsx"
---

# React Component Conventions

## Component Structure
- Functional components only — no class components
- One component per file, file name matches component name
- Export as named export (not default)

## File Organization
```
src/
  pages/            — Route-level page components
  components/       — Shared app-level components
  hooks/            — Custom hooks
  api/              — Typed API client functions
  types/            — App-specific type extensions
```

## Hooks
- Custom hooks start with `use` prefix
- Extract API calls into custom hooks or api/ functions
- Use the typed API client from `api/` — never raw `fetch` in components

## API Client
- All API calls go through the typed client in `src/api/`
- Client functions return typed responses matching `packages/domain` types
- Handle loading/error states consistently

## Styling
- No inline styles
- Use CSS modules or a consistent styling approach
- Component-specific styles co-located with the component file

## Types
- Import domain types from `@atlas/domain` for entity shapes
- Keep component prop types in the same file as the component
- Use explicit prop interfaces, not inline types
