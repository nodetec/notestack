'use client';

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $computeTableMapSkipCellCheck,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  getTableElement,
  TableNode,
  type TableCellNode,
  type TableDOMCell,
  type TableMapType,
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, isHTMLElement, type NodeKey } from 'lexical';

type PointerPosition = {
  x: number;
  y: number;
};

type PointerDraggingDirection = 'right' | 'bottom';

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 92;

function TableCellResizer() {
  const [editor] = useLexicalComposerContext();
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<DOMRect | null>(null);
  const [hasTable, setHasTable] = useState(false);

  const pointerStartPosRef = useRef<PointerPosition | null>(null);
  const [pointerCurrentPos, updatePointerCurrentPos] = useState<PointerPosition | null>(null);

  const [activeCell, updateActiveCell] = useState<TableDOMCell | null>(null);
  const [draggingDirection, updateDraggingDirection] = useState<PointerDraggingDirection | null>(null);
  const [hoveredDirection, updateHoveredDirection] = useState<PointerDraggingDirection | null>(null);

  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    updateHoveredDirection(null);
    pointerStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);

  useEffect(() => {
    const tableKeys = new Set<NodeKey>();
    return mergeRegister(
      editor.registerMutationListener(TableNode, (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === 'destroyed') {
            tableKeys.delete(nodeKey);
          } else {
            tableKeys.add(nodeKey);
          }
        }
        setHasTable(tableKeys.size > 0);
      }),
      editor.registerNodeTransform(TableNode, (tableNode) => {
        if (tableNode.getColWidths()) {
          return tableNode;
        }

        const numColumns = tableNode.getColumnCount();
        const columnWidth = MIN_COLUMN_WIDTH;

        tableNode.setColWidths(Array(numColumns).fill(columnWidth));
        return tableNode;
      }),
    );
  }, [editor]);

  useEffect(() => {
    if (!hasTable) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }

      if (draggingDirection) {
        event.preventDefault();
        event.stopPropagation();
        updatePointerCurrentPos({
          x: event.clientX,
          y: event.clientY,
        });
        return;
      }
      if (resizerRef.current && resizerRef.current.contains(target)) {
        return;
      }

      if (targetRef.current !== target) {
        targetRef.current = target;
        const cell = getDOMCellFromTarget(target);

        if (cell && activeCell !== cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) {
                return;
              }

              const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
              const tableElement = getTableElement(
                tableNode,
                editor.getElementByKey(tableNode.getKey()),
              );

              if (!tableElement) {
                return;
              }

              targetRef.current = target;
              tableRectRef.current = tableElement.getBoundingClientRect();
              updateActiveCell(cell);
            },
            { editor },
          );
        } else if (cell == null) {
          resetState();
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const isTouchEvent = event.pointerType === 'touch';
      if (isTouchEvent) {
        onPointerMove(event);
      }
    };

    const resizerContainer = resizerRef.current;
    resizerContainer?.addEventListener('pointermove', onPointerMove, {
      capture: true,
    });

    const removeRootListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        prevRootElement?.removeEventListener('pointermove', onPointerMove);
        prevRootElement?.removeEventListener('pointerdown', onPointerDown);
        rootElement?.addEventListener('pointermove', onPointerMove);
        rootElement?.addEventListener('pointerdown', onPointerDown);
      },
    );

    return () => {
      removeRootListener();
      resizerContainer?.removeEventListener('pointermove', onPointerMove);
    };
  }, [activeCell, draggingDirection, editor, resetState, hasTable]);

  const isHeightChanging = (direction: PointerDraggingDirection) => {
    return direction === 'bottom';
  };

  const updateRowHeight = useCallback(
    (heightChange: number) => {
      if (!activeCell) {
        return;
      }

      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          return;
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const baseRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
        const tableRows = tableNode.getChildren();

        const isFullRowMerge = tableCellNode.getColSpan() === tableNode.getColumnCount();
        const tableRowIndex = isFullRowMerge
          ? baseRowIndex
          : baseRowIndex + tableCellNode.getRowSpan() - 1;

        if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
          return;
        }

        const tableRow = tableRows[tableRowIndex];

        if (!$isTableRowNode(tableRow)) {
          return;
        }

        let height = tableRow.getHeight();
        if (height === undefined) {
          const rowCells = tableRow.getChildren<TableCellNode>();
          height = Math.min(
            ...rowCells.map((cell) => {
              const domCell = editor.getElementByKey(cell.getKey());
              return domCell?.clientHeight ?? Infinity;
            }),
          );
        }

        const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
        tableRow.setHeight(newHeight);
      });
    },
    [activeCell, editor],
  );

  const getCellColumnIndex = (
    tableCellNode: TableCellNode,
    tableMap: TableMapType,
  ) => {
    for (let row = 0; row < tableMap.length; row++) {
      for (let column = 0; column < tableMap[row].length; column++) {
        if (tableMap[row][column].cell === tableCellNode) {
          return column;
        }
      }
    }
    return undefined;
  };

  const updateColumnWidth = useCallback(
    (widthChange: number) => {
      if (!activeCell) {
        return;
      }
      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          return;
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
        const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
        if (columnIndex === undefined) {
          return;
        }

        const colWidths = tableNode.getColWidths();
        if (!colWidths) {
          return;
        }
        const width = colWidths[columnIndex];
        if (width === undefined) {
          return;
        }
        const newColWidths = [...colWidths];
        const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
        newColWidths[columnIndex] = newWidth;
        tableNode.setColWidths(newColWidths);
      });
    },
    [activeCell, editor],
  );

  const pointerUpHandler = useCallback(
    (direction: PointerDraggingDirection) => {
      const handler = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          return;
        }

        if (pointerStartPosRef.current) {
          const { x, y } = pointerStartPosRef.current;

          if (isHeightChanging(direction)) {
            const heightChange = event.clientY - y;
            updateRowHeight(heightChange);
          } else {
            const widthChange = event.clientX - x;
            updateColumnWidth(widthChange);
          }

          resetState();
          document.removeEventListener('pointerup', handler);
        }
      };
      return handler;
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight],
  );

  const toggleResize = useCallback(
    (direction: PointerDraggingDirection) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!activeCell) {
        return;
      }

      pointerStartPosRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      updatePointerCurrentPos(pointerStartPosRef.current);
      updateDraggingDirection(direction);

      document.addEventListener('pointerup', pointerUpHandler(direction));
    },
    [activeCell, pointerUpHandler],
  );

  const getResizers = useCallback(() => {
    if (activeCell) {
      const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
      const zoneWidth = 16;

      const styles: Record<string, React.CSSProperties> = {
        bottom: {
          backgroundColor: 'transparent',
          cursor: 'row-resize',
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height - zoneWidth / 2}px`,
          width: `${width}px`,
        },
        right: {
          backgroundColor: 'transparent',
          cursor: 'col-resize',
          height: `${height}px`,
          left: `${window.scrollX + left + width - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`,
        },
      };

      const tableRect = tableRectRef.current;

      if (draggingDirection && pointerCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left = `${window.scrollX + tableRect.left}px`;
          styles[draggingDirection].top = `${window.scrollY + pointerCurrentPos.y}px`;
          styles[draggingDirection].height = '3px';
          styles[draggingDirection].width = `${tableRect.width}px`;
        } else {
          styles[draggingDirection].top = `${window.scrollY + tableRect.top}px`;
          styles[draggingDirection].left = `${window.scrollX + pointerCurrentPos.x}px`;
          styles[draggingDirection].width = '3px';
          styles[draggingDirection].height = `${tableRect.height}px`;
        }

        styles[draggingDirection].backgroundColor = '#adf';
      } else if (!draggingDirection && hoveredDirection === 'right') {
        const halfZoneWidth = zoneWidth / 2;
        const highlightWidth = 2;
        const highlightStart = halfZoneWidth - highlightWidth / 2;
        styles.right.background = `linear-gradient(90deg, transparent ${highlightStart}px, #76b6ff ${highlightStart}px, #76b6ff ${
          highlightStart + highlightWidth
        }px, transparent ${highlightStart + highlightWidth}px)`;
        if (tableRect) {
          styles.right.top = `${window.scrollY + tableRect.top}px`;
          styles.right.height = `${tableRect.height}px`;
        }
      }

      return styles;
    }

    return {
      bottom: undefined,
      right: undefined,
    };
  }, [activeCell, draggingDirection, hoveredDirection, pointerCurrentPos]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerRef}>
      {activeCell != null && (
        <>
          <div
            className="absolute"
            style={resizerStyles.right}
            onPointerEnter={() => {
              if (!draggingDirection) {
                updateHoveredDirection('right');
              }
            }}
            onPointerLeave={() => {
              if (!draggingDirection) {
                updateHoveredDirection(null);
              }
            }}
            onPointerDown={toggleResize('right')}
          />
          <div
            className="absolute"
            style={resizerStyles.bottom}
            onPointerDown={toggleResize('bottom')}
          />
        </>
      )}
    </div>
  );
}

export default function TableCellResizerPlugin() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(<TableCellResizer />, document.body);
}
