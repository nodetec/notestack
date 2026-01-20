'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isRootOrShadowRoot,
} from 'lexical';
import { $isHeadingNode, $createHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  Undo2Icon,
  Redo2Icon,
  CodeXmlIcon,
  ImageIcon,
  TableIcon,
  YoutubeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { $createImageNode } from '../nodes/ImageNode';
import HeadingSelect from '../toolbar/HeadingSelect';
import ImageDialog from '../toolbar/ImageDialog';
import InsertTableDialog from '../toolbar/InsertTableDialog';
import YouTubeDialog from '../toolbar/YouTubeDialog';
import type { BlockType } from '../toolbar/constants';

interface ToolbarPluginProps {
  portalContainer: HTMLElement | null;
}

export default function ToolbarPlugin({ portalContainer }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag as BlockType);
        } else if ($isCodeNode(element)) {
          setBlockType('code');
        } else {
          setBlockType('paragraph');
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  const formatText = useCallback(
    (format: 'bold' | 'italic' | 'strikethrough' | 'code') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const handleBlockTypeChange = useCallback(
    (type: BlockType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (type === 'paragraph') {
            $setBlocksType(selection, () => $createParagraphNode());
          } else if (type === 'h1' || type === 'h2' || type === 'h3') {
            $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType));
          } else if (type === 'code') {
            $setBlocksType(selection, () => $createCodeNode());
          }
        }
      });
    },
    [editor]
  );

  const insertCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  }, [editor]);

  const insertImage = useCallback(
    (url: string, altText: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode({ src: url, altText });
          selection.insertNodes([imageNode]);
        }
      });
    },
    [editor]
  );

  const openTableDialog = useCallback(() => {
    setShowTableDialog(true);
  }, []);

  if (!portalContainer) {
    return null;
  }

  const toolbar = (
    <div className="flex items-center gap-0.5" onMouseDown={(e) => e.preventDefault()}>
      <HeadingSelect blockType={blockType} onSelect={handleBlockTypeChange} disabled={false} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => formatText('bold')}
            aria-pressed={isBold}
                       className={isBold  ? 'bg-accent' : ''}
          >
            <BoldIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold (Ctrl+B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => formatText('italic')}
            aria-pressed={isItalic}
                       className={isItalic  ? 'bg-accent' : ''}
          >
            <ItalicIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic (Ctrl+I)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => formatText('strikethrough')}
            aria-pressed={isStrikethrough}
                       className={isStrikethrough  ? 'bg-accent' : ''}
          >
            <StrikethroughIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Strikethrough</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => formatText('code')}
            aria-pressed={isCode}
                       className={isCode  ? 'bg-accent' : ''}
          >
            <CodeIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Inline Code</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            disabled={!canUndo}
          >
            <Undo2Icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            disabled={!canRedo}
          >
            <Redo2Icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6 hidden md:block" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={insertCodeBlock}
                       className="hidden md:flex"
          >
            <CodeXmlIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Code Block</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowImageDialog(true)}
                       className="hidden md:flex"
          >
            <ImageIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Insert Image</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={openTableDialog}
            className="hidden md:flex"
          >
            <TableIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Insert Table</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowYouTubeDialog(true)}
            className="hidden md:flex"
          >
            <YoutubeIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Embed YouTube</TooltipContent>
      </Tooltip>

      <ImageDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={insertImage}
      />

      <InsertTableDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        editor={editor}
      />

      <YouTubeDialog
        isOpen={showYouTubeDialog}
        onClose={() => setShowYouTubeDialog(false)}
      />
    </div>
  );

  return createPortal(toolbar, portalContainer);
}
