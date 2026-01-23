'use client';

import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';

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
    }, [onChange]);

    return (
      <textarea
        ref={textareaRef}
        defaultValue={initialContent}
        onChange={handleChange}
        placeholder={placeholder}
        className="editor-root w-full min-h-full flex-auto py-8 pb-[30%] outline-none bg-transparent text-foreground font-mono text-sm leading-relaxed resize-none"
        spellCheck={false}
      />
    );
  }
);

export default MarkdownEditor;
