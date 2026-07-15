# TanStack Start Scratch Project

A high-performance Server-Side Rendered (SSR) web application built from scratch using **TanStack Start**, **Rsbuild**, **Bun**, **MySQL**, and **Shadcn UI**.

## Project Context & Chosen Stack

- **Framework**: TanStack Start (powered by React and TanStack Router)
- **Bundler / Build Tool**: Rsbuild (powered by Rspack for fast compilation)
- **Package Manager / Runtime**: Bun (v1.3.10)
- **Database**: MySQL (initialized via `mysql2` connection pool)
- **Styling**: Tailwind CSS v4 & Shadcn UI components

---

## Architectural Decisions & Files Created

### 1. TypeScript Configuration (`tsconfig.json`)
We configured a custom `tsconfig.json` conforming to TanStack Start's guidelines:
- Set `"moduleResolution": "Bundler"`, `"module": "ESNext"`, and `"target": "ES2022"`.
- Set `"verbatimModuleSyntax": false` (disabled as recommended in the TanStack guides to prevent server-only modules from leaking into client-side bundles).
- Configured `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` to support path aliases required by Shadcn.

### 2. Rsbuild Configuration (`rsbuild.config.ts`)
Conforms to TanStack Start's integration with Rsbuild and registers `@rsbuild/plugin-tailwindcss`:
```ts
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'
import { tanstackStart } from '@tanstack/react-start/plugin/rsbuild'

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [pluginReact(), tanstackStart(), pluginTailwindcss()],
  tools: {
    rspack: {
      externals: ['bun:sqlite', 'better-sqlite3'],
    },
  },
})
```

### 3. Router Setup (`src/router.tsx`)
Initializes the TanStack Router with standard scroll restoration and registers the router types:
```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### 4. Root Page Component (`src/routes/__root.tsx`)
Serves as the main HTML shell wrapper. Implements `<HeadContent />` and `<Scripts />` required by TanStack Start, and imports the global stylesheet `src/styles.css`. Implements simplified navigation and cookie-based logout.

### 5. Index Page Component (`src/routes/index.tsx`)
Welcome portal demonstrating the template's technical stack with direct links to the login page or the admin dashboard.

### 6. Admin Dashboard Page (`src/routes/admin/index.tsx`)
Comprehensive interactive dashboard designed as a template showcase:
- Performs database connection state checks and queries users count using a Server Function (`getDbStatusFn`).
- Showcases various installed Shadcn v4 UI components (Button, Badge, Card, Select, Input, Label, Dialog, Alert Dialog, Skeleton) in an interactive UI playground.

---

## Command Reference

- **Development Server** (runs on port `3000`):
  ```shell
  bun run dev
  ```
- **Production Build** (compiles client & SSR bundles to `dist/`):
  ```shell
  bun run build
  ```
- **Production Server Start** (runs the built app locally with static assets served via Rsbuild preview):
  ```shell
  bun run start
  ```
- **Database Schema Push** (syncs Drizzle schema directly with MySQL db):
  ```shell
  bun run db:push
  ```
- **Database Seeder** (seeds default admin and customer user credentials):
  ```shell
  bun run db:seed
  ```

---

## Gotchas & Troubleshooting

- **Server-Side Bundling**: Never import the database connection `db` directly in client-side router files. Always wrap database queries in Server Functions (`createServerFn`) and call them from loaders or event handlers.
- **Server Bundles Leaking**: Ensure `"verbatimModuleSyntax": false` stays configured in `tsconfig.json`.
- **Router Tree Generation**: The file `src/routeTree.gen.ts` is automatically generated and updated by TanStack Start on running `dev` or `build` commands. Do not edit it manually.
