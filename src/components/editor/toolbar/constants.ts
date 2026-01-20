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

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'code';

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  code: 'Code Block',
};
