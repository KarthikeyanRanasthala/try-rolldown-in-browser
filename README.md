# Try Rolldown in Browser

A browser-based playground for [Rolldown](https://rolldown.rs), the Rust-based JavaScript bundler. Use NPM packages, write code, see it bundled in real-time, and preview the output.

## Features

- Monaco editor for code editing
- Real-time bundling with Rolldown WASM
- Live preview of bundled output
- Support for JSX/TSX, CSS, and HTML
- Bare npm imports resolved via ESM CDN

## HTTP Import ESM Plugin

The playground includes a custom Rolldown plugin that resolves bare npm imports to ESM CDN URLs and fetches them at build time. This enables importing any npm package without a `node_modules` directory.

```js
// These imports just work
import React from "react";
import confetti from "canvas-confetti";
```

How it works:

1. **Resolve**: Bare imports like `react` are transformed to `https://esm.sh/react@latest`
2. **Fetch**: The plugin fetches the ESM bundle from the CDN
3. **Transitive deps**: The CDN handles transitive dependencies, returning fully bundled ESM

The plugin supports:

- Scoped packages (`@org/package`)
- Subpath imports (`react-dom/client`)
- Version pinning via configuration
- Custom CDN endpoints
- Dependency overrides for specific packages

See [`src/rolldown/http-import-esm-plugin.ts`](src/rolldown/http-import-esm-plugin.ts) for the implementation.

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

Deployed on Vercel with required headers for SharedArrayBuffer support:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## Tech Stack

- [Rolldown](https://rolldown.rs) - Rust bundler compiled to WASM
- [Vite](https://vite.dev) - Dev server and build tool
- [React](https://react.dev) - UI framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [esm.sh](https://esm.sh) - ESM CDN for npm packages
