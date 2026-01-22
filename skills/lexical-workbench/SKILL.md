---
name: lexical-workbench
description: "Guide for working with the Lexical editor codebase and docs in docs/lexical. Use when implementing or debugging Lexical features: editor state, updates/selection, commands, nodes/serialization, plugins, extensions, transforms, React integration, or theming, especially when the task requires consulting Lexical documentation or source structure in this repo."
---

# Lexical Workbench

## Overview
Use the local Lexical docs and source tree in `docs/lexical` to answer questions, plan changes, and implement fixes for Lexical editor behavior, plugins, nodes, or extensions.

## Workflow
1. Identify the task type (core editor, selection/commands, node/serialization, plugin/React, extensions, transforms/theming).
2. Open the relevant docs under `docs/lexical/packages/lexical-website/docs` (see `references/lexical-docs-map.md`).
3. Locate the implementation in `docs/lexical/packages/*` and confirm the API or pattern before changing code.
4. Apply changes in the target project, keeping Lexical update/read rules and selection constraints in mind.

## Core Practices
- Use `$` helpers only inside `editor.update`, `editor.read`, or implicit update contexts (transforms/command handlers).
- Prefer `editor.getEditorState().read()` when you need reconciled state; avoid mixing update/read contexts.
- When building UI plugins, track scroll/selection changes and place UI relative to the correct scroll container.
- For custom nodes, implement required static/instance methods and register nodes in editor config.
- For extensions, follow the extension design docs and locate existing extension patterns in `lexical-react` and `lexical-extension` packages.

## Resources
- Read `references/lexical-docs-map.md` for a map of relevant docs and source locations.
- Read `docs/lexical/AGENTS.md` when you need Lexical build/test commands or repo architecture details.
