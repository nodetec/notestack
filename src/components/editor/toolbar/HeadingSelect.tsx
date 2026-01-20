'use client';

import { ChevronDownIcon, Heading1Icon, Heading2Icon, Heading3Icon, PilcrowIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { BlockType } from './constants';
import { BLOCK_TYPE_LABELS } from './constants';

interface HeadingSelectProps {
  blockType: BlockType;
  onSelect: (type: BlockType) => void;
  disabled?: boolean;
}

const BLOCK_TYPE_ICONS: Record<BlockType, React.ReactNode> = {
  paragraph: <PilcrowIcon className="size-4" />,
  h1: <Heading1Icon className="size-4" />,
  h2: <Heading2Icon className="size-4" />,
  h3: <Heading3Icon className="size-4" />,
  code: null,
};

export default function HeadingSelect({ blockType, onSelect, disabled = false }: HeadingSelectProps) {
  const selectableTypes: BlockType[] = ['paragraph', 'h1', 'h2', 'h3'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2 font-normal" disabled={disabled}>
          {BLOCK_TYPE_ICONS[blockType]}
          <span className="hidden sm:inline">{BLOCK_TYPE_LABELS[blockType]}</span>
          <ChevronDownIcon className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {selectableTypes.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onSelect(type)}
            className={blockType === type ? 'bg-accent' : ''}
          >
            {BLOCK_TYPE_ICONS[type]}
            <span>{BLOCK_TYPE_LABELS[type]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
