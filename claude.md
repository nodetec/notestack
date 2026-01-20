# NED - Nostr Editor

A rich text editor for Nostr built with Facebook's Lexical framework, designed to be abstracted as a standalone library.

## Project Overview

NED (Nostr EDitor) is a React-based rich text editor specifically designed for the Nostr protocol. It uses Lexical as its foundation and provides native support for Nostr-specific features like mentions, hashtags, media attachments, and proper event serialization.

### Goals

1. **Nostr-native**: First-class support for Nostr conventions (NIP-10, NIP-23, NIP-27, etc.)
2. **Library-ready**: Designed for extraction as a standalone npm package
3. **Extensible**: Plugin-based architecture for custom functionality
4. **Type-safe**: Full TypeScript support throughout

## Tech Stack

- **Framework**: Next.js 16.x (React 19.x)
- **Editor**: Lexical (`lexical` + `@lexical/react`)
- **Styling**: Tailwind CSS 4.x
- **Language**: TypeScript 5.x

## Project Structure

```
src/
├── app/                      # Next.js app router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── editor/               # Editor components (library-ready)
│       ├── NostrEditor.tsx   # Main editor component
│       ├── plugins/          # Lexical plugins
│       │   ├── MentionPlugin.tsx
│       │   ├── HashtagPlugin.tsx
│       │   ├── MediaPlugin.tsx
│       │   ├── LinkPlugin.tsx
│       │   └── ToolbarPlugin.tsx
│       ├── nodes/            # Custom Lexical nodes
│       │   ├── MentionNode.tsx
│       │   ├── HashtagNode.tsx
│       │   └── MediaNode.tsx
│       ├── themes/           # Editor themes
│       │   └── default.ts
│       ├── utils/            # Utilities
│       │   ├── nostr.ts      # Nostr serialization
│       │   └── nip19.ts      # NIP-19 encoding/decoding
│       └── index.ts          # Public API exports
└── lib/                      # Shared utilities
    └── nostr/                # Nostr-specific helpers
        ├── types.ts          # Nostr event types
        └── tags.ts           # Tag generation utilities
```

## Nostr Integration

### Supported NIPs

| NIP | Description | Implementation |
|-----|-------------|----------------|
| NIP-01 | Basic protocol & event structure | Core event serialization |
| NIP-10 | Text notes (kind:1) | Plaintext output, e/p tags |
| NIP-19 | bech32 entities | npub/note/nprofile display |
| NIP-21 | nostr: URI scheme | Link parsing and generation |
| NIP-23 | Long-form content (kind:30023) | Markdown output |
| NIP-24 | Extra metadata | Hashtag tags (lowercase) |
| NIP-27 | Text note references | Inline `nostr:` mentions |
| NIP-30 | Custom emoji | Emoji shortcode support |
| NIP-92 | Media attachments | imeta tag generation |

### Event Kinds

The editor supports two primary output modes:

1. **Kind 1 (Text Note)**: Plaintext output per NIP-10
   - No Markdown or HTML
   - Mentions as `nostr:npub...` or `nostr:nprofile...`
   - Thread support via `e` tags with markers

2. **Kind 30023 (Long-form)**: Markdown output per NIP-23
   - Standard Markdown syntax
   - No hard line breaks at column boundaries
   - No embedded HTML
   - Addressable via `d` tag

### Tag Generation

The editor automatically generates appropriate tags:

```typescript
// User mention
["p", "<pubkey-hex>", "<relay-hint>"]

// Event reference (reply)
["e", "<event-id>", "<relay-url>", "reply"]

// Hashtag (always lowercase)
["t", "nostr"]

// Quote/citation
["q", "<event-id>", "<relay-url>", "<pubkey>"]

// Media metadata
["imeta", "url <url>", "m <mime-type>", "dim <WxH>", "x <sha256>"]

// Custom emoji
["emoji", "shortcode", "<image-url>"]
```

### Content Format

**Mentions in content:**
```
Hello nostr:npub1abc123... check out nostr:note1xyz789...
```

**Hashtags in content:**
```
Learning about #nostr and #bitcoin today!
```

## Lexical Architecture

### Core Concepts

1. **EditorState**: Immutable state containing the node tree and selection
2. **Nodes**: Building blocks (RootNode, ElementNode, TextNode, DecoratorNode)
3. **Plugins**: Modular functionality that can be lazy-loaded
4. **Commands**: Communication system for editor actions

### Custom Nodes

Each Nostr-specific feature requires a custom node:

```typescript
// MentionNode - for @mentions (nostr:npub/nprofile)
class MentionNode extends DecoratorNode<React.ReactNode> {
  __pubkey: string;      // hex pubkey
  __relayHint?: string;  // optional relay
  __displayName?: string;

  static getType(): string { return 'mention'; }

  exportJSON(): SerializedMentionNode { ... }
  static importJSON(json: SerializedMentionNode): MentionNode { ... }

  // Renders as nostr:nprofile... or nostr:npub...
  getTextContent(): string { ... }
}
```

### Plugin Pattern

```typescript
function MentionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register node transforms
    // Register commands
    // Set up autocomplete triggers
    return () => { /* cleanup */ };
  }, [editor]);

  return <MentionAutocomplete />;
}
```

### Serialization Flow

```
Lexical EditorState
        ↓
    toJSON()
        ↓
  Custom transformer
        ↓
  Nostr Event Content + Tags
```

## Development Guidelines

### Adding a New Node

1. Create node class in `src/components/editor/nodes/`
2. Implement `getType()`, `clone()`, `importJSON()`, `exportJSON()`
3. Implement `createDOM()`, `updateDOM()`, `decorate()` (for DecoratorNode)
4. Register in editor config's `nodes` array
5. Create corresponding plugin if needed

### Adding a New Plugin

1. Create plugin in `src/components/editor/plugins/`
2. Use `useLexicalComposerContext()` to access editor
3. Register transforms/commands in `useEffect`
4. Clean up subscriptions on unmount
5. Add to `NostrEditor.tsx` plugin composition

### Serialization Rules

- **Kind 1**: Strip all formatting, output plain text only
- **Kind 30023**: Convert to Markdown, preserve structure
- Both: Generate appropriate tags from nodes

### Code Style

- Use TypeScript strict mode
- Prefix Lexical $ functions with $ (e.g., `$getSelection()`)
- Use `editor.update()` for write operations
- Use `editor.read()` for read-only operations
- Never mutate state outside update/read callbacks

## API Design (Future Library)

```typescript
// Main exports
export { NostrEditor } from './NostrEditor';
export { useNostrEditor } from './hooks/useNostrEditor';

// Node exports
export { MentionNode } from './nodes/MentionNode';
export { HashtagNode } from './nodes/HashtagNode';
export { MediaNode } from './nodes/MediaNode';

// Plugin exports
export { MentionPlugin } from './plugins/MentionPlugin';
export { HashtagPlugin } from './plugins/HashtagPlugin';
export { MediaPlugin } from './plugins/MediaPlugin';

// Utility exports
export { serializeToNostrEvent } from './utils/nostr';
export { parseFromNostrEvent } from './utils/nostr';

// Types
export type { NostrEditorProps, NostrEvent, SerializedEditor } from './types';
```

### Usage Example

```tsx
import { NostrEditor, serializeToNostrEvent } from 'ned';

function PostComposer() {
  const handlePublish = (editorState: EditorState) => {
    const event = serializeToNostrEvent(editorState, {
      kind: 1,
      pubkey: userPubkey,
    });
    // Sign and publish event
  };

  return (
    <NostrEditor
      kind={1}
      placeholder="What's happening?"
      onSubmit={handlePublish}
    />
  );
}
```

## Testing Checklist

- [ ] Mention autocomplete triggers on `@`
- [ ] Hashtag autocomplete triggers on `#`
- [ ] Media uploads generate correct imeta tags
- [ ] Kind 1 output is pure plaintext
- [ ] Kind 30023 output is valid Markdown
- [ ] All pubkeys stored as hex, displayed as bech32
- [ ] Tags are deduplicated and properly ordered
- [ ] Custom emoji renders correctly
- [ ] Copy/paste preserves Nostr entities
- [ ] Undo/redo works correctly

## Resources

### Lexical Documentation
- [Lexical Docs](https://lexical.dev/docs/intro)
- [React Integration](https://lexical.dev/docs/getting-started/react)
- [Custom Nodes](https://lexical.dev/docs/concepts/nodes)

### Nostr Documentation
- NIPs repository: `docs/nips/`
- Key NIPs: 01, 10, 19, 21, 23, 27, 30, 92

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```
