import {
  BoldIcon,
  Code,
  ItalicIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
} from "lucide-react";

export enum RichTextAction {
  Bold = "bold",
  Italics = "italics",
  Strikethrough = "strikethrough",
  Code = "code",
  Divider = "divider",
  Undo = "undo",
  Redo = "redo",
}

export const RICH_TEXT_OPTIONS = [
  {
    id: RichTextAction.Bold,
    icon: <BoldIcon className="h-4 w-4" />,
    label: "Bold",
  },
  {
    id: RichTextAction.Italics,
    icon: <ItalicIcon className="h-4 w-4" />,
    label: "Italics",
  },
  {
    id: RichTextAction.Strikethrough,
    icon: <StrikethroughIcon className="h-4 w-4" />,
    label: "Strikethrough",
  },
  {
    id: RichTextAction.Code,
    icon: <Code className="h-4 w-4" />,
    label: "Code",
  },

  { id: RichTextAction.Divider },
  {
    id: RichTextAction.Undo,
    icon: <UndoIcon className="h-4 w-4" />,
    label: "Undo",
  },
  {
    id: RichTextAction.Redo,
    icon: <RedoIcon className="h-4 w-4" />,
    label: "Redo",
  },
  { id: RichTextAction.Divider },
];

export const LOW_PRIORIRTY = 1;
export const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
