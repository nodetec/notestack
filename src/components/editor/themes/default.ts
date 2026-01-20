import type { EditorThemeClasses } from 'lexical';

// VS Code Dark+ theme colors
const codeHighlightClasses = {
  atrule: 'text-[#C586C0]',           // pink/magenta - @rules
  attr: 'text-[#9CDCFE]',             // light blue - attributes
  boolean: 'text-[#569CD6]',          // blue - true/false
  builtin: 'text-[#4EC9B0]',          // teal - built-in types
  cdata: 'text-[#6A9955]',            // green - CDATA
  char: 'text-[#CE9178]',             // orange - characters
  class: 'text-[#4EC9B0]',            // teal - class names
  'class-name': 'text-[#4EC9B0]',     // teal - class names
  comment: 'text-[#6A9955]',          // green - comments
  constant: 'text-[#4FC1FF]',         // bright blue - constants
  deleted: 'text-[#CE9178]',          // orange - deleted
  doctype: 'text-[#6A9955]',          // green - doctype
  entity: 'text-[#569CD6]',           // blue - entities
  function: 'text-[#DCDCAA]',         // yellow - functions
  important: 'text-[#569CD6]',        // blue - important
  inserted: 'text-[#B5CEA8]',         // light green - inserted
  keyword: 'text-[#569CD6]',          // blue - keywords
  namespace: 'text-[#4EC9B0]',        // teal - namespaces
  number: 'text-[#B5CEA8]',           // light green - numbers
  operator: 'text-[#D4D4D4]',         // light gray - operators
  prolog: 'text-[#6A9955]',           // green - prolog
  property: 'text-[#9CDCFE]',         // light blue - properties
  punctuation: 'text-[#D4D4D4]',      // light gray - punctuation
  regex: 'text-[#D16969]',            // red - regex
  selector: 'text-[#D7BA7D]',         // gold - selectors
  string: 'text-[#CE9178]',           // orange - strings
  symbol: 'text-[#569CD6]',           // blue - symbols
  tag: 'text-[#569CD6]',              // blue - tags
  url: 'text-[#CE9178]',              // orange - urls
  variable: 'text-[#9CDCFE]',         // light blue - variables
};

const theme: EditorThemeClasses = {
  ltr: 'text-left',
  rtl: 'text-right',
  paragraph: 'mb-2 last:mb-0',
  quote: 'border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-600 dark:text-zinc-400',
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
    listitemChecked: 'line-through text-zinc-500',
    listitemUnchecked: '',
  },
  link: 'inline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    code: 'bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5 font-mono text-sm',
  },
  code: 'bg-zinc-100 dark:bg-[#1E1E1E] rounded-lg p-4 font-mono text-sm block mb-2 overflow-x-auto',
  codeHighlight: codeHighlightClasses,
  image: 'inline-block my-2',
  hr: 'my-6 border-t border-zinc-300 dark:border-zinc-600',
  table: 'border-collapse border border-zinc-300 dark:border-zinc-700 my-4 w-full',
  tableCell: 'border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left align-top',
  tableCellHeader: 'border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left font-bold bg-zinc-100 dark:bg-zinc-800',
  tableRow: '',
  tableSelected: 'bg-blue-100 dark:bg-blue-900/30',
  tableCellSelected: 'bg-blue-100 dark:bg-blue-900/30',
};

export default theme;
