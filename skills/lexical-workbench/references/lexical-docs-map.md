# Lexical Docs Map

Use this as a navigation index for the local Lexical docs and source tree inside `docs/lexical`.

## Primary docs root
- `docs/lexical/packages/lexical-website/docs`

### Concepts (core editor behavior)
- `docs/lexical/packages/lexical-website/docs/concepts/`
  - commands, updates, selection, editor-state, transforms, serialization, nodes

### Extensions
- `docs/lexical/packages/lexical-website/docs/extensions/`
  - intro, defining-extensions, included-extensions, react, migration, signals

### React integration & plugins
- `docs/lexical/packages/lexical-website/docs/react/`
  - create_plugin, plugins, faq

### Getting started & theming
- `docs/lexical/packages/lexical-website/docs/getting-started/`
  - quick-start, creating-plugin, theming, react

## Source code waypoints
- Core editor: `docs/lexical/packages/lexical/src/`
  - `LexicalEditor.ts`, `LexicalEditorState.ts`, `LexicalSelection.ts`, `LexicalCommands.ts`
- React bindings/plugins: `docs/lexical/packages/lexical-react/src/`
  - `LexicalComposer.tsx`, `LexicalComposerContext.ts`, `LexicalRichTextPlugin.tsx`, `LexicalContentEditable.tsx`
- Extensions: `docs/lexical/packages/lexical-extension/` and `docs/lexical/packages/lexical-react/src/*Extension*.tsx`
- Nodes: `docs/lexical/packages/lexical/src/nodes/` and feature packages (e.g., `lexical-rich-text`, `lexical-list`)

## Suggested search patterns
- Commands: `rg -n "registerCommand|COMMAND_PRIORITY" docs/lexical`
- Updates/read: `rg -n "editor.update|editor.read" docs/lexical`
- Nodes/serialization: `rg -n "exportJSON|importJSON|createDOM|updateDOM" docs/lexical`
- Extensions: `rg -n "Extension" docs/lexical/packages/lexical-website/docs/extensions`
- Plugins: `rg -n "Plugin" docs/lexical/packages/lexical-website/docs/react`

## Repo guide
- Build/test/dev commands and architecture notes live in `docs/lexical/AGENTS.md`.
