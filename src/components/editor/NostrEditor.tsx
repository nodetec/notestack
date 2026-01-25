'use client';

import { useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
} from '@lexical/markdown';
import { defineExtension, $getRoot, $createTextNode } from 'lexical';
import type { EditorState } from 'lexical';
import { $isCodeNode, $createCodeNode } from '@lexical/code';

import { EditorContext, type ProfileLookupFn, type NoteLookupFn } from './context/EditorContext';

// Extensions
import { RichTextExtension } from '@lexical/rich-text';
import { HistoryExtension } from '@lexical/history';
import { ListExtension } from '@lexical/list';
import { CodeExtension } from '@lexical/code';
import {
  AutoFocusExtension,
  TabIndentationExtension,
  HorizontalRuleExtension,
} from '@lexical/extension';
import { TableExtension } from '@lexical/table';

import theme from './themes/default';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import ScrollCenterCurrentLinePlugin from './plugins/ScrollCenterCurrentLinePlugin';
import ListBackspacePlugin from './plugins/ListBackspacePlugin';
import CodeBlockShortcutPlugin from './plugins/CodeBlockShortcutPlugin';
import InitialContentPlugin from './plugins/InitialContentPlugin';
import ImagePastePlugin from './plugins/ImagePastePlugin';
import LinkPastePlugin from './plugins/LinkPastePlugin';
import NostrPastePlugin from './plugins/NostrPastePlugin';
import MarkdownPastePlugin from './plugins/MarkdownPastePlugin';
import { ImageNode } from './nodes/ImageNode';
import { LinkNode } from './nodes/LinkNode';
import { NpubNode } from './nodes/NpubNode';
import { NprofileNode } from './nodes/NprofileNode';
import { NeventNode } from './nodes/NeventNode';
import { NaddrNode } from './nodes/NaddrNode';
import { YouTubeNode } from './nodes/YouTubeNode';
import { CollapseIndicatorNode } from './nodes/CollapseIndicatorNode';
import { IMAGE } from './transformers/ImageTransformer';
import { LINK } from './transformers/LinkTransformer';
import { NOSTR_TRANSFORMERS } from './transformers/NostrTransformers';
import { TABLE, setTableTransformers } from './transformers/TableTransformer';
import { HORIZONTAL_RULE } from './transformers/HorizontalRuleTransformer';
import { YOUTUBE_TRANSFORMER } from './transformers/YouTubeTransformer';
import TableActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizerPlugin from './plugins/TableCellResizerPlugin';
import TableClickOutsidePlugin from './plugins/TableClickOutsidePlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import HighlightPlugin from './plugins/HighlightPlugin';
import GutterActionsPlugin from './plugins/GutterActionsPlugin';
import CodeSnippetPublishPlugin from './plugins/CodeSnippetPublishPlugin';
import HeadingAnchorPlugin from './plugins/HeadingAnchorPlugin';

// Source information for NIP-84 highlights
export interface HighlightSource {
  kind: number;
  pubkey: string;
  identifier: string;
  relay?: string;
}

// Re-export Highlight type for convenience
export type { Highlight } from '@/lib/nostr/types';

interface NostrEditorProps {
  placeholder?: string;
  onChange?: (editorState: EditorState) => void;
  autoFocus?: boolean;
  initialMarkdown?: string;
  onProfileLookup?: ProfileLookupFn;
  onNoteLookup?: NoteLookupFn;
  toolbarContainer?: HTMLElement | null;
  readOnly?: boolean;
  highlightSource?: HighlightSource; // For NIP-84 highlights when viewing articles
  highlights?: import('@/lib/nostr/types').Highlight[]; // Existing highlights to display
  onHighlightDeleted?: (highlightId: string) => void; // Callback when highlight is deleted
  onHighlightCreated?: (highlight: import('@/lib/nostr/types').Highlight) => void; // Callback when highlight is created
}

export interface NostrEditorHandle {
  getMarkdown: () => string;
  toggleMarkdownMode: () => void;
  isMarkdownMode: () => boolean;
}

// All transformers for markdown conversion
export const ALL_TRANSFORMERS = [
  YOUTUBE_TRANSFORMER,
  TABLE,
  HORIZONTAL_RULE,
  IMAGE,
  LINK,
  ...NOSTR_TRANSFORMERS,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
];

// Set transformers for table cell content parsing
setTableTransformers(ALL_TRANSFORMERS as any);

// Inner component to access editor context
function EditorInner({
  editorRef,
  placeholder,
  onChange,
  toolbarContainer,
  initialMarkdown,
  readOnly,
  highlightSource,
  highlights,
  onHighlightDeleted,
  onHighlightCreated,
}: {
  editorRef: React.RefObject<NostrEditorHandle | null>;
  placeholder: string;
  onChange?: (editorState: EditorState) => void;
  toolbarContainer?: HTMLElement | null;
  initialMarkdown?: string;
  readOnly?: boolean;
  highlightSource?: HighlightSource;
  highlights?: import('@/lib/nostr/types').Highlight[];
  onHighlightDeleted?: (highlightId: string) => void;
  onHighlightCreated?: (highlight: import('@/lib/nostr/types').Highlight) => void;
}) {
  const [editor] = useLexicalComposerContext();

  // Set editor editable state
  useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useImperativeHandle(editorRef, () => ({
    getMarkdown: () => {
      let markdown = '';
      editor.getEditorState().read(() => {
        markdown = $convertToMarkdownString(ALL_TRANSFORMERS, undefined, false);
      });
      return markdown;
    },
    isMarkdownMode: () => {
      let inMarkdownMode = false;
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        inMarkdownMode = $isCodeNode(firstChild) &&
          firstChild.getLanguage() === 'markdown' &&
          root.getChildrenSize() === 1;
      });
      return inMarkdownMode;
    },
    toggleMarkdownMode: () => {
      let currentlyInMarkdownMode = false;
      let markdownContent = '';

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        currentlyInMarkdownMode = $isCodeNode(firstChild) &&
          firstChild.getLanguage() === 'markdown' &&
          root.getChildrenSize() === 1;

        if (currentlyInMarkdownMode && firstChild) {
          markdownContent = firstChild.getTextContent();
        } else {
          try {
            markdownContent = $convertToMarkdownString(ALL_TRANSFORMERS, undefined, false);
          } catch (err) {
            console.error('Error converting to markdown:', err);
            markdownContent = '';
          }
        }
      });

      editor.update(() => {
        const root = $getRoot();

        if (currentlyInMarkdownMode) {
          try {
            $convertFromMarkdownString(markdownContent, ALL_TRANSFORMERS, undefined, false);
          } catch (err) {
            console.error('Error converting from markdown:', err);
            return;
          }
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
          });
        } else {
          const codeNode = $createCodeNode('markdown');
          codeNode.append($createTextNode(markdownContent));
          root.clear().append(codeNode);
          if (markdownContent.length === 0) {
            codeNode.select();
          }
        }
      });
    },
  }));

  return (
    <>
      <LexicalErrorBoundary onError={(error) => console.error('Lexical error:', error)}>
        <ContentEditable
          className="editor-root relative min-h-full flex-auto py-8 pb-[30%] outline-none text-foreground font-[family-name:var(--font-source-serif-4)] text-lg leading-relaxed"
          aria-placeholder={placeholder}
          placeholder={
            <div className="editor-placeholder absolute top-8 text-muted-foreground pointer-events-none select-none font-[family-name:var(--font-source-serif-4)]">
              {placeholder}
            </div>
          }
        />
      </LexicalErrorBoundary>
      <GutterActionsPlugin />
      <CodeSnippetPublishPlugin />
      <HeadingAnchorPlugin />
      {onChange && (
        <OnChangePlugin
          onChange={(editorState) => onChange(editorState)}
        />
      )}
      {toolbarContainer && (
        <ToolbarPlugin
          portalContainer={toolbarContainer}
        />
      )}
      <ImagePastePlugin />
      <LinkPastePlugin />
      <NostrPastePlugin />
      <MarkdownPastePlugin />
      {initialMarkdown && <InitialContentPlugin markdown={initialMarkdown} />}
      <ScrollCenterCurrentLinePlugin />
      <ListBackspacePlugin />
      <CodeBlockShortcutPlugin />
      <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
      <TableActionMenuPlugin />
      <TableCellResizerPlugin />
      <TableClickOutsidePlugin />
      <CodeHighlightPlugin />
      <HighlightPlugin source={highlightSource} highlights={highlights} onHighlightDeleted={onHighlightDeleted} onHighlightCreated={onHighlightCreated} />
    </>
  );
}

const NostrEditor = forwardRef<NostrEditorHandle, NostrEditorProps>(function NostrEditor(
  {
    placeholder = 'Start writing...',
    onChange,
    autoFocus = false,
    initialMarkdown,
    onProfileLookup,
    onNoteLookup,
    toolbarContainer,
    readOnly = false,
    highlightSource,
    highlights,
    onHighlightDeleted,
    onHighlightCreated,
  },
  ref
) {
  const editorExtension = useMemo(
    () =>
      defineExtension({
        name: 'NostrEditor',
        namespace: 'NostrEditor',
        theme,
        nodes: [
          ImageNode,
          LinkNode,
          NpubNode,
          NprofileNode,
          NeventNode,
          NaddrNode,
          YouTubeNode,
          CollapseIndicatorNode,
        ],
        onError: (error: Error) => console.error('Lexical error:', error),
        dependencies: [
          RichTextExtension,
          HistoryExtension,
          ListExtension,
          CodeExtension,
          HorizontalRuleExtension,
          TabIndentationExtension,
          TableExtension,
          ...(autoFocus ? [AutoFocusExtension] : []),
        ],
      }),
    [autoFocus]
  );

  const editorContextValue = useMemo(
    () => ({ onProfileLookup, onNoteLookup }),
    [onProfileLookup, onNoteLookup]
  );

  return (
    <EditorContext.Provider value={editorContextValue}>
      <LexicalExtensionComposer extension={editorExtension} contentEditable={null}>
        <div className="relative flex-1 min-h-full flex flex-col">
          <div className="relative flex-1 flex flex-col">
            <EditorInner
              editorRef={ref as React.RefObject<NostrEditorHandle | null>}
              placeholder={placeholder}
              onChange={onChange}
              toolbarContainer={toolbarContainer}
              initialMarkdown={initialMarkdown}
              readOnly={readOnly}
              highlightSource={highlightSource}
              highlights={highlights}
              onHighlightDeleted={onHighlightDeleted}
              onHighlightCreated={onHighlightCreated}
            />
          </div>
        </div>
      </LexicalExtensionComposer>
    </EditorContext.Provider>
  );
});

export default NostrEditor;
