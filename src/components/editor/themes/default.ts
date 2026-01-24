import type { EditorThemeClasses } from 'lexical';

// Golden Hour light theme + Dark+ overrides
const codeHighlightClasses = {
  atrule: 'text-[#B45309] dark:text-[#C586C0]',           // amber - @rules
  attr: 'text-[#0369A1] dark:text-[#9CDCFE]',             // deep blue - attributes
  boolean: 'text-[#0369A1] dark:text-[#569CD6]',          // deep blue - true/false
  builtin: 'text-[#0D9488] dark:text-[#4EC9B0]',          // teal - built-in types
  cdata: 'text-[#4D7C0F] dark:text-[#6A9955]',            // olive green - CDATA
  char: 'text-[#C2410C] dark:text-[#CE9178]',             // burnt orange - characters
  class: 'text-[#0D9488] dark:text-[#4EC9B0]',            // teal - class names
  'class-name': 'text-[#0D9488] dark:text-[#4EC9B0]',     // teal - class names
  comment: 'text-[#6B7280] dark:text-[#6A9955]',          // muted gray - comments
  constant: 'text-[#0369A1] dark:text-[#4FC1FF]',         // deep blue - constants
  deleted: 'text-[#B91C1C] dark:text-[#CE9178]',          // red - deleted
  doctype: 'text-[#4D7C0F] dark:text-[#6A9955]',          // olive green - doctype
  entity: 'text-[#0369A1] dark:text-[#569CD6]',           // deep blue - entities
  function: 'text-[#B45309] dark:text-[#DCDCAA]',         // amber - functions
  important: 'text-[#B45309] dark:text-[#569CD6]',        // amber - important
  inserted: 'text-[#4D7C0F] dark:text-[#B5CEA8]',         // olive green - inserted
  keyword: 'text-[#B45309] dark:text-[#569CD6]',          // amber - keywords
  namespace: 'text-[#0D9488] dark:text-[#4EC9B0]',        // teal - namespaces
  number: 'text-[#C2410C] dark:text-[#B5CEA8]',           // burnt orange - numbers
  operator: 'text-[#4A403A] dark:text-[#D4D4D4]',         // chocolate - operators
  prolog: 'text-[#4D7C0F] dark:text-[#6A9955]',           // olive green - prolog
  property: 'text-[#0369A1] dark:text-[#9CDCFE]',         // deep blue - properties
  punctuation: 'text-[#4A403A] dark:text-[#D4D4D4]',      // chocolate - punctuation
  regex: 'text-[#B91C1C] dark:text-[#D16969]',            // red - regex
  selector: 'text-[#C2410C] dark:text-[#D7BA7D]',         // burnt orange - selectors
  string: 'text-[#4D7C0F] dark:text-[#CE9178]',           // olive green - strings
  symbol: 'text-[#0369A1] dark:text-[#569CD6]',           // deep blue - symbols
  tag: 'text-[#B45309] dark:text-[#569CD6]',              // amber - tags
  url: 'text-[#0369A1] dark:text-[#3794FF]',              // blue - urls
  variable: 'text-[#0369A1] dark:text-[#9CDCFE]',         // deep blue - variables
  // Markdown-specific tokens
  title: 'text-[#B45309] dark:text-[#569CD6] font-bold',  // # headings
  bold: 'font-bold text-[#4A403A] dark:text-[#D4D4D4]',   // **bold**
  italic: 'italic text-[#4A403A] dark:text-[#D4D4D4]',    // *italic*
  strike: 'line-through',                                  // ~~strike~~
  'code-snippet': 'text-[#C2410C] dark:text-[#CE9178]',   // `inline code`
  'code-block': 'text-[#C2410C] dark:text-[#CE9178]',     // ```code block```
  'code-language': 'text-[#0D9488] dark:text-[#4EC9B0]',  // ```language
  blockquote: 'text-[#6B7280] dark:text-[#6A9955]',       // > quote
  hr: 'text-[#6B7280] dark:text-[#6A9955]',               // ---
  list: 'text-[#B45309] dark:text-[#569CD6]',             // - or 1.
  'url-reference': 'text-[#0369A1] dark:text-[#3794FF]',  // [id]: url
  table: 'text-[#4A403A] dark:text-[#D4D4D4]',            // | table |
  'table-header': 'text-[#B45309] dark:text-[#569CD6] font-bold',
  'table-header-row': 'text-[#B45309] dark:text-[#569CD6]',
  'table-data': 'text-[#4A403A] dark:text-[#D4D4D4]',
  'table-data-rows': 'text-[#4A403A] dark:text-[#D4D4D4]',
  'table-line': 'text-[#6B7280] dark:text-[#6A9955]',
  'front-matter': 'text-[#0D9488] dark:text-[#4EC9B0]',   // YAML front matter
  'front-matter-block': 'text-[#0D9488] dark:text-[#4EC9B0]',
};

const theme: EditorThemeClasses = {
  ltr: 'text-left',
  rtl: 'text-right',
  paragraph: 'mb-2 last:mb-0',
  quote: 'border-l-4 border-primary/30 pl-4 italic text-muted-foreground',
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-bold mb-3',
    h3: 'text-xl font-bold mb-2',
    h4: 'text-lg font-bold mb-2',
    h5: 'text-base font-bold mb-1',
    h6: 'text-sm font-bold mb-1',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-6 mb-2',
    ul: 'list-disc ml-6 mb-2',
    listitem: 'mb-1',
    listitemChecked: 'line-through text-muted-foreground',
    listitemUnchecked: '',
  },
  link: 'inline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    code: 'bg-muted rounded px-1 py-0.5 font-mono text-sm',
  },
  code: 'bg-muted dark:bg-[#1E1E1E] rounded-lg p-4 font-mono text-sm block mb-2 overflow-x-auto',
  codeHighlight: codeHighlightClasses,
  image: 'inline-block my-2',
  hr: 'my-6 border-t border-border',
  table: 'border-collapse border border-border my-4 w-full',
  tableCell: 'border border-border px-3 py-2 text-left align-top',
  tableCellHeader: 'border border-border px-3 py-2 text-left font-bold bg-muted',
  tableRow: '',
  tableSelected: 'bg-primary/10 dark:bg-primary/20',
  tableCellSelected: 'bg-primary/10 dark:bg-primary/20',
};

export default theme;
