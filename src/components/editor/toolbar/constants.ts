export enum RichTextAction {
  Bold = 'bold',
  Italic = 'italic',
  Strikethrough = 'strikethrough',
  Code = 'code',
  Undo = 'undo',
  Redo = 'redo',
  CodeBlock = 'code-block',
  Image = 'image',
}

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code';

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  code: 'Code Block',
};
