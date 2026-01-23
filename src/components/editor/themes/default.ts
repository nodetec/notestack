import type { EditorThemeClasses } from 'lexical';

// Light theme base + Dark+ overrides
const codeHighlightClasses = {
  atrule: 'text-[#7C3AED] dark:text-[#C586C0]',           // purple - @rules
  attr: 'text-[#0EA5E9] dark:text-[#9CDCFE]',             // blue - attributes
  boolean: 'text-[#2563EB] dark:text-[#569CD6]',          // blue - true/false
  builtin: 'text-[#0D9488] dark:text-[#4EC9B0]',          // teal - built-in types
  cdata: 'text-[#15803D] dark:text-[#6A9955]',            // green - CDATA
  char: 'text-[#B45309] dark:text-[#CE9178]',             // amber - characters
  class: 'text-[#0D9488] dark:text-[#4EC9B0]',            // teal - class names
  'class-name': 'text-[#0D9488] dark:text-[#4EC9B0]',     // teal - class names
  comment: 'text-[#16A34A] dark:text-[#6A9955]',          // green - comments
  constant: 'text-[#0284C7] dark:text-[#4FC1FF]',         // blue - constants
  deleted: 'text-[#B45309] dark:text-[#CE9178]',          // amber - deleted
  doctype: 'text-[#15803D] dark:text-[#6A9955]',          // green - doctype
  entity: 'text-[#2563EB] dark:text-[#569CD6]',           // blue - entities
  function: 'text-[#7C3AED] dark:text-[#DCDCAA]',         // purple (lighter in dark)
  important: 'text-[#1D4ED8] dark:text-[#569CD6]',        // blue - important
  inserted: 'text-[#15803D] dark:text-[#B5CEA8]',         // green - inserted
  keyword: 'text-[#1D4ED8] dark:text-[#569CD6]',          // blue - keywords
  namespace: 'text-[#0D9488] dark:text-[#4EC9B0]',        // teal - namespaces
  number: 'text-[#0F766E] dark:text-[#B5CEA8]',           // teal - numbers
  operator: 'text-[#334155] dark:text-[#D4D4D4]',         // slate - operators
  prolog: 'text-[#15803D] dark:text-[#6A9955]',           // green - prolog
  property: 'text-[#0EA5E9] dark:text-[#9CDCFE]',         // blue - properties
  punctuation: 'text-[#1F2937] dark:text-[#D4D4D4]',      // darker gray - punctuation
  regex: 'text-[#B91C1C] dark:text-[#D16969]',            // red - regex
  selector: 'text-[#B45309] dark:text-[#D7BA7D]',         // amber - selectors
  string: 'text-[#B45309] dark:text-[#CE9178]',           // amber - strings
  symbol: 'text-[#2563EB] dark:text-[#569CD6]',           // blue - symbols
  tag: 'text-[#1D4ED8] dark:text-[#569CD6]',              // blue - tags
  url: 'text-[#B45309] dark:text-[#CE9178]',              // amber - urls
  variable: 'text-[#0EA5E9] dark:text-[#9CDCFE]',         // blue - variables
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
