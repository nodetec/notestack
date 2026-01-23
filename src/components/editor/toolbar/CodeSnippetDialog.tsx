'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { publishCodeSnippet } from '@/lib/nostr/publish';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { toast } from 'sonner';

interface CodeSnippetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language?: string;
}

const EXTENSION_BY_LANGUAGE: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  rust: 'rs',
  go: 'go',
  bash: 'sh',
  shell: 'sh',
  json: 'json',
  markdown: 'md',
  html: 'html',
  css: 'css',
  yaml: 'yml',
};

export default function CodeSnippetDialog({ isOpen, onClose, code, language }: CodeSnippetDialogProps) {
  const relays = useSettingsStore((state) => state.relays);
  const [name, setName] = useState('');
  const [languageValue, setLanguageValue] = useState('');
  const [extension, setExtension] = useState('');
  const [description, setDescription] = useState('');
  const [license, setLicense] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const normalizedLanguage = useMemo(() => languageValue.trim().toLowerCase(), [languageValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName('');
    setLanguageValue(language ?? '');
    setExtension('');
    setDescription('');
    setLicense('');
    setLicenseUrl('');
    if (language) {
      const inferred = EXTENSION_BY_LANGUAGE[language.toLowerCase()];
      if (inferred) {
        setExtension(inferred);
      }
    }
  }, [isOpen, language]);

  useEffect(() => {
    if (!languageValue || extension) {
      return;
    }
    const inferred = EXTENSION_BY_LANGUAGE[languageValue.toLowerCase()];
    if (inferred) {
      setExtension(inferred);
    }
  }, [languageValue, extension]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      toast.error('Code snippet is empty');
      return;
    }
    if (!relays.length) {
      toast.error('No relays configured');
      return;
    }

    setIsPublishing(true);
    try {
      const results = await publishCodeSnippet({
        content: code,
        language: normalizedLanguage || undefined,
        name: name.trim() || undefined,
        extension: extension.trim() || undefined,
        description: description.trim() || undefined,
        license: license.trim() || undefined,
        licenseUrl: licenseUrl.trim() || undefined,
        relays,
      });

      const successCount = results.filter((result) => result.success).length;
      if (successCount > 0) {
        toast.success(`Published to ${successCount} relay${successCount === 1 ? '' : 's'}`);
        onClose();
      } else {
        toast.error('Failed to publish to any relay');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPublishing && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto py-6">
        <DialogHeader>
          <DialogTitle>Publish code snippet</DialogTitle>
          <DialogDescription>
            Fill in any missing NIP-C0 metadata before posting a kind 1337 snippet.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Code</label>
            <Textarea
              value={code}
              readOnly
              rows={6}
              className="max-h-48 min-h-24 font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Language</label>
              <Input
                value={languageValue}
                onChange={(event) => setLanguageValue(event.target.value)}
                placeholder="javascript"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Extension</label>
              <Input
                value={extension}
                onChange={(event) => setExtension(event.target.value)}
                placeholder="js"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Name</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="hello-world.js"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Description</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this snippet do?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">License</label>
              <Input
                value={license}
                onChange={(event) => setLicense(event.target.value)}
                placeholder="MIT"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">License URL</label>
              <Input
                value={licenseUrl}
                onChange={(event) => setLicenseUrl(event.target.value)}
                placeholder="https://opensource.org/licenses/MIT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPublishing || !relays.length}>
              {isPublishing ? 'Publishing…' : 'Publish snippet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
