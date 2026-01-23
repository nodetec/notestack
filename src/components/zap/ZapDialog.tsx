'use client';

import { useState, useEffect } from 'react';
import { ZapIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { sendZap, type ZapRequest } from '@/lib/nostr/zap';
import { fetchProfileEvent } from '@/lib/nostr/profiles';
import type { NostrEvent } from '@/lib/nostr/types';

interface ZapDialogProps {
  children: React.ReactNode;
  recipientPubkey: string;
  articleAddress?: string; // "30023:pubkey:d-tag"
  eventId?: string;
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

export default function ZapDialog({
  children,
  recipientPubkey,
  articleAddress,
  eventId,
}: ZapDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileEvent, setProfileEvent] = useState<NostrEvent | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [noLightningAddress, setNoLightningAddress] = useState(false);

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const { secretKey } = useAuth();

  // Fetch recipient profile when dialog opens
  useEffect(() => {
    if (!open || !recipientPubkey) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setNoLightningAddress(false);

      try {
        const profile = await fetchProfileEvent(recipientPubkey, activeRelay);

        if (profile) {
          setProfileEvent(profile);
          // Check if profile has lightning address
          try {
            const content = JSON.parse(profile.content);
            if (!content.lud16 && !content.lud06) {
              setNoLightningAddress(true);
            }
          } catch {
            setNoLightningAddress(true);
          }
        } else {
          setNoLightningAddress(true);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setNoLightningAddress(true);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [open, recipientPubkey, activeRelay]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleQuickAmount = (sats: number) => {
    setAmount(sats.toString());
  };

  const handleSubmit = async () => {
    const sats = parseInt(amount, 10);

    if (!sats || sats <= 0) {
      toast.error('Invalid amount', {
        description: 'Please enter an amount greater than 0',
      });
      return;
    }

    if (!profileEvent) {
      toast.error('Profile not loaded', {
        description: 'Could not load recipient profile',
      });
      return;
    }

    setIsLoading(true);

    try {
      const zapRequest: ZapRequest = {
        recipientPubkey,
        amount: sats * 1000, // Convert to millisats
        relays,
        comment: comment || undefined,
        address: articleAddress,
        eventId,
      };

      await sendZap(zapRequest, profileEvent, secretKey);

      toast.success('Zap sent!', {
        description: `${sats.toLocaleString()} sats sent successfully`,
      });

      // Reset and close
      setAmount('');
      setComment('');
      setOpen(false);
    } catch (err) {
      console.error('Zap failed:', err);

      const message = err instanceof Error ? err.message : 'Failed to send zap';

      if (message.includes('WebLN not available')) {
        toast.error('Lightning wallet required', {
          description: 'Please install a Lightning wallet extension like Alby',
        });
      } else if (message.includes('No Nostr extension')) {
        toast.error('Nostr signer required', {
          description: 'Please install a Nostr extension like nos2x or Alby',
        });
      } else if (message.includes('No Lightning address')) {
        toast.error('No Lightning address', {
          description: 'This author has not set up a Lightning address',
        });
      } else {
        toast.error('Zap failed', {
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setComment('');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-yellow-500" />
            Send Zap
          </DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : noLightningAddress ? (
          <div className="py-8 text-center text-zinc-500">
            <p className="mb-2">This author has no Lightning address set up.</p>
            <p className="text-sm">They need to add a Lightning address (lud16) to their Nostr profile to receive zaps.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount input */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Amount (sats)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                disabled={isLoading}
              />
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2">
              {QUICK_AMOUNTS.map((sats) => (
                <Button
                  key={sats}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickAmount(sats)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {sats >= 1000 ? `${sats / 1000}k` : sats}
                </Button>
              ))}
            </div>

            {/* Comment input */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Comment (optional)
              </label>
              <Input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a message"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || isLoading || noLightningAddress || loadingProfile}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <ZapIcon className="w-4 h-4 mr-2" />
                Zap {amount ? `${parseInt(amount, 10).toLocaleString()} sats` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
