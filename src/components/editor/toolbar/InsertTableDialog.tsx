'use client';

import { useEffect, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InsertTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: LexicalEditor;
}

export default function InsertTableDialog({ isOpen, onClose, editor }: InsertTableDialogProps) {
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('3');
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);

  const handleInsert = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
      includeHeaders: { rows: true, columns: false },
    });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rows" className="text-right">
              Rows
            </Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="500"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="col-span-3"
              placeholder="1-500"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="columns" className="text-right">
              Columns
            </Label>
            <Input
              id="columns"
              type="number"
              min="1"
              max="50"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="col-span-3"
              placeholder="1-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={isDisabled}>
            Insert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
