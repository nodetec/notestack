'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
  TableSelection,
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  getDOMSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TableIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

function computeSelectionCount(selection: TableSelection): {
  columns: number;
  rows: number;
} {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  };
}

interface TableActionMenuProps {
  tableCellNode: TableCellNode;
  onClose: () => void;
}

function TableActionMenu({ tableCellNode: _tableCellNode, onClose }: TableActionMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  });
  const [isHeaderRow, setIsHeaderRow] = useState(false);

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      (nodeMutations) => {
        const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated';

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
        }
      },
      { skipInitialization: true },
    );
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        updateSelectionCounts(computeSelectionCount(selection));
      }
      // Check if current cell is in a header row
      const headerState = tableCellNode.getHeaderStyles();
      setIsHeaderRow((headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW);
    });
  }, [editor, tableCellNode]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(
          tableNode,
          editor.getElementByKey(tableNode.getKey()),
        );

        if (tableElement === null) {
          return;
        }

        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }

        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
    });
  }, [editor, tableCellNode]);

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          $insertTableRowAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumnAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns],
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = tableCellNode.getIndexWithinParent();

      const tableRows = tableNode.getChildren();
      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        return;
      }

      const tableRow = tableRows[tableRowIndex];
      if (!tableRow || !$isTableRowNode(tableRow)) {
        return;
      }

      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;

      tableRow.getChildren().forEach((cell) => {
        if ($isTableCellNode(cell)) {
          cell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
        }
      });

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  return (
    <>
      {!isHeaderRow && (
        <DropdownMenuItem onClick={() => insertTableRowAtSelection(false)}>
          <ArrowUpIcon className="mr-2 size-4" />
          Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} above
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => insertTableRowAtSelection(true)}>
        <ArrowDownIcon className="mr-2 size-4" />
        Insert {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`} below
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => insertTableColumnAtSelection(false)}>
        <ArrowLeftIcon className="mr-2 size-4" />
        Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`} left
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => insertTableColumnAtSelection(true)}>
        <ArrowRightIcon className="mr-2 size-4" />
        Insert {selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`} right
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {!isHeaderRow && (
        <DropdownMenuItem onClick={deleteTableRowAtSelection}>
          <TrashIcon className="mr-2 size-4" />
          Delete row
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={deleteTableColumnAtSelection}>
        <TrashIcon className="mr-2 size-4" />
        Delete column
      </DropdownMenuItem>
      <DropdownMenuItem onClick={deleteTableAtSelection}>
        <TrashIcon className="mr-2 size-4" />
        Delete table
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={toggleTableRowIsHeader}>
        <TableIcon className="mr-2 size-4" />
        {(tableCellNode.__headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
          ? 'Remove'
          : 'Add'}{' '}
        row header
      </DropdownMenuItem>
    </>
  );
}

function TableCellActionMenuContainer({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMenuOpenRef = useRef(false);
  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(null);

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);

    function disable() {
      // Don't disable if the menu is currently open
      if (isMenuOpenRef.current) {
        return;
      }
      if (menu) {
        menu.style.opacity = '0';
        menu.style.pointerEvents = 'none';
      }
      setTableMenuCellNode(null);
    }

    if (selection == null || menu == null) {
      return disable();
    }

    const rootElement = editor.getRootElement();

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );

      if (tableCellNodeFromSelection == null) {
        return disable();
      }

      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      );

      if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
        return disable();
      }

      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection);
      const tableElement = getTableElement(
        tableNode,
        editor.getElementByKey(tableNode.getKey()),
      );

      if (tableElement === null) {
        return disable();
      }

      const tableObserver = getTableObserverFromTableElement(tableElement);
      const enabled = !tableObserver || !tableObserver.isSelecting;

      if (enabled) {
        const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
        const anchorRect = anchorElem.getBoundingClientRect();
        const top = tableCellRect.top - anchorRect.top + 4;
        const right = anchorRect.right - tableCellRect.right + 4;
        menu.style.transform = `translate(${-right}px, ${top}px)`;
        menu.style.opacity = '1';
        menu.style.pointerEvents = 'auto';
      } else {
        menu.style.opacity = '0';
        menu.style.pointerEvents = 'none';
      }

      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection(selection)) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );
      if (!$isTableCellNode(tableCellNodeFromSelection)) {
        return disable();
      }
      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      );
      if (tableCellParentNodeDOM === null) {
        return disable();
      }
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = tableCellRect.top - anchorRect.top + 4;
      const right = anchorRect.right - tableCellRect.right + 4;
      menu.style.transform = `translate(${-right}px, ${top}px)`;
      menu.style.opacity = '1';
      menu.style.pointerEvents = 'auto';
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else {
      return disable();
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        delayedCallback,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('pointerup', delayedCallback);
        }
        if (rootElement) {
          rootElement.addEventListener('pointerup', delayedCallback);
          delayedCallback();
        }
      }),
      () => clearTimeout(timeoutId),
    );
  }, [editor, $moveMenu]);

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);

  return (
    <div
      ref={menuButtonRef}
      className="absolute right-0 top-0 opacity-0 pointer-events-none z-10"
      style={{ transform: 'translate(0, 0)' }}
    >
      {tableCellNode != null && (
        <DropdownMenu
          modal={false}
          open={isMenuOpen}
          onOpenChange={(open) => {
            isMenuOpenRef.current = open;
            setIsMenuOpen(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Set ref immediately before any async updates
                isMenuOpenRef.current = true;
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ChevronDownIcon className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <TableActionMenu
              tableCellNode={tableCellNode}
              onClose={() => {
                isMenuOpenRef.current = false;
                setIsMenuOpen(false);
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

interface TableActionMenuPluginProps {
  anchorElem?: HTMLElement;
}

export default function TableActionMenuPlugin({
  anchorElem,
}: TableActionMenuPluginProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const target = anchorElem ?? document.body;
  return createPortal(<TableCellActionMenuContainer anchorElem={target} />, target);
}
