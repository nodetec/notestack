'use client';

import { forwardRef, useImperativeHandle, useRef, useCallback, useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';

export interface MarkdownEditorHandle {
  getMarkdown: () => string;
  setMarkdown: (content: string) => void;
}

interface MarkdownEditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ initialContent, onChange, placeholder }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [highlighted, setHighlighted] = useState('');

    useImperativeHandle(ref, () => ({
      getMarkdown: () => textareaRef.current?.value ?? '',
      setMarkdown: (content: string) => {
        if (textareaRef.current) {
          textareaRef.current.value = content;
        }
      },
    }));

    const handleChange = useCallback(() => {
      if (onChange && textareaRef.current) {
        onChange(textareaRef.current.value);
      }
      if (textareaRef.current) {
        const value = textareaRef.current.value;
        setHighlighted(Prism.highlight(value, Prism.languages.markdown, 'markdown'));
      }
    }, [onChange]);

    useEffect(() => {
      setHighlighted(Prism.highlight(initialContent || '', Prism.languages.markdown, 'markdown'));
    }, [initialContent]);

    const handleScroll = useCallback(() => {
      if (!textareaRef.current || !preRef.current) return;
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }, []);

    return (
      <div className="relative w-full min-h-full flex-auto">
        <pre
          ref={preRef}
          aria-hidden
          className="editor-root pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground py-8 pb-[30%]"
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
        <textarea
          ref={textareaRef}
          defaultValue={initialContent}
          onChange={handleChange}
          onScroll={handleScroll}
          placeholder={placeholder}
          className="editor-root absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-foreground outline-none font-mono text-sm leading-relaxed py-8 pb-[30%]"
          spellCheck={false}
        />
      </div>
    );
  }
);

export default MarkdownEditor;
