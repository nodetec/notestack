# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router entry points (`layout.tsx`, `page.tsx`, `globals.css`).
- `src/components/`: UI and editor surface, including `editor/` (Lexical-based editor), `sidebar/`, and shared `ui/` atoms.
- `src/lib/`: Nostr helpers, stores, and shared utilities (`lib/nostr`, `lib/stores`, `lib/utils`).
- `src/hooks/`: Reusable React hooks.
- `public/`: Static assets and metadata (`manifest.json`, icons).

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server at `http://localhost:3000`.
- `npm run build`: Production build.
- `npm run start`: Run the built app.
- `npm run lint`: Run ESLint (Next.js core-web-vitals + TypeScript rules).

## Coding Style & Naming Conventions
- Language: TypeScript with React 19 and Next.js 16.
- Components use PascalCase filenames (e.g., `NostrEditor.tsx`); hooks use `useX` naming (e.g., `useProfiles.ts`).
- Follow existing formatting in the touched file; no Prettier config is present.
- Linting is enforced via `eslint.config.mjs`; fix lint issues before committing.
- Tailwind CSS 4 is used for styling; prefer utilities over ad-hoc CSS unless a global style is needed in `src/app/globals.css`.

## Testing Guidelines
- No automated test runner is configured in this repo.
- For changes to the editor or Nostr logic, add focused tests if you introduce a test setup; otherwise document manual verification steps in the PR (e.g., “create draft, insert image, publish”).

## Commit & Pull Request Guidelines
- Recent commits are short, imperative summaries without prefixes (e.g., “fix up images”). Match that style.
- PRs should include: a concise description, the commands run (`npm run lint`, `npm run build` if relevant), and screenshots or screen recordings for UI changes.
- Link related issues if applicable.

## Nostr Editor Notes
- The editor is Lexical-based; core logic lives under `src/components/editor/` and Nostr helpers under `src/lib/nostr/`.
- When extending nodes or plugins, keep changes localized and document any serialization changes in the PR description.
