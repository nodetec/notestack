'use client';

import { useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Button } from '@/components/ui/button';

export default function SettingsView() {
  const { relays, activeRelay, addRelay, removeRelay, setActiveRelay } = useSettingsStore();
  const [newRelay, setNewRelay] = useState('');

  const handleAddRelay = () => {
    const trimmed = newRelay.trim();
    if (trimmed && trimmed.startsWith('wss://')) {
      addRelay(trimmed);
      setNewRelay('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRelay();
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col bg-background pt-6">
      {/* Header */}
      <div className="mb-5 border-b border-border/70 pt-2">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-medium text-foreground">
            Relays
          </h2>
        </div>
      </div>

      {/* Relays Content */}
      <div className="flex-1 overflow-y-auto overscroll-none py-3">
        <div className="space-y-4">
          <div>
            <ul className="space-y-2">
              {relays.map((relay) => {
                const isActive = relay === activeRelay;
                return (
                  <li
                    key={relay}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40'
                        : 'bg-muted hover:bg-sidebar-accent'
                    }`}
                    onClick={() => setActiveRelay(relay)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isActive && (
                        <CheckIcon className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                      <span className={`truncate ${isActive ? 'text-primary' : 'text-foreground/80'}`}>
                        {relay}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRelay(relay);
                      }}
                      className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground flex-shrink-0"
                      title="Remove relay"
                      aria-label="Remove relay"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Add Relay
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="wss://relay.example.com"
                className="flex-1 px-2 py-1.5 text-xs bg-card border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="url"
              />
              <Button
                size="sm"
                onClick={handleAddRelay}
                disabled={!newRelay.trim() || !newRelay.startsWith('wss://')}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
