'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XIcon, Loader2Icon, UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchProfileEvent } from '@/lib/nostr/profiles';
import { parseProfileContent, publishProfile, type ProfileContent } from '@/lib/nostr/profile';

const profileFormSchema = z.object({
  name: z.string().max(30, 'Username must be 30 characters or less').optional(),
  picture: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  about: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  lud16: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfilePanelProps {
  onClose: () => void;
  pubkey?: string;
}

export default function ProfilePanel({ onClose, pubkey }: ProfilePanelProps) {
  const router = useRouter();
  const { state: sidebarState, isMobile } = useSidebar();
  const relays = useSettingsStore((state) => state.relays);
  const { secretKey } = useAuth();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(!!pubkey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ProfileContent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      picture: '',
      about: '',
      website: '',
      lud16: '',
    },
  });

  const pictureUrl = watch('picture');

  // Fetch existing profile on mount
  useEffect(() => {
    if (!pubkey) return;

    const currentPubkey = pubkey;
    async function loadProfile() {
      setIsLoading(true);
      try {
        // Try to fetch from the first relay
        const event = await fetchProfileEvent(currentPubkey, relays[0]);
        if (event) {
          const content = parseProfileContent(event);
          setExistingProfile(content);
          reset({
            name: content.name || '',
            picture: content.picture || '',
            about: content.about || '',
            website: content.website || '',
            lud16: content.lud16 || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [pubkey, relays, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);

    try {
      // Merge with existing profile to preserve fields we don't edit
      const content: ProfileContent = {
        ...existingProfile,
        name: data.name || undefined,
        picture: data.picture || undefined,
        about: data.about || undefined,
        website: data.website || undefined,
        lud16: data.lud16 || undefined,
      };

      // Remove undefined/empty values
      Object.keys(content).forEach((key) => {
        if (content[key] === undefined || content[key] === '') {
          delete content[key];
        }
      });

      const results = await publishProfile(content, relays, secretKey);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast.success('Profile updated', {
          description: `Published to ${successCount} of ${results.length} relays`,
        });
        // Invalidate profile queries
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        setExistingProfile(content);
      } else {
        toast.error('Failed to update profile', {
          description: 'Could not publish to any relay',
        });
      }
    } catch (error) {
      console.error('Failed to publish profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-y-0 z-50 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground/80">
          Profile
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
          title="Close panel"
          aria-label="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none p-3">
        {!pubkey ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground/80 mb-2">
              Sign in to manage your profile
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Connect with your Nostr account to edit your profile settings
            </p>
            <Button onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Username
              </Label>
              <Input
                id="name"
                placeholder="satoshi"
                {...register('name')}
                className="text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Picture URL with preview */}
            <div className="space-y-1.5">
              <Label htmlFor="picture" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Picture URL
              </Label>
              <div className="flex items-center gap-3">
                {pictureUrl && (
                  <img
                    src={pictureUrl}
                    alt="Avatar preview"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <Input
                  id="picture"
                  placeholder="https://..."
                  {...register('picture')}
                  className="text-sm flex-1"
                />
              </div>
              {errors.picture && (
                <p className="text-xs text-red-500">{errors.picture.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="about" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Bio
              </Label>
              <Textarea
                id="about"
                placeholder="Tell us a little bit about yourself"
                {...register('about')}
                className="text-sm resize-none min-h-20"
              />
              {errors.about && (
                <p className="text-xs text-red-500">{errors.about.message}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Website
              </Label>
              <Input
                id="website"
                placeholder="https://..."
                {...register('website')}
                className="text-sm"
              />
              {errors.website && (
                <p className="text-xs text-red-500">{errors.website.message}</p>
              )}
            </div>

            {/* Lightning Address */}
            <div className="space-y-1.5">
              <Label htmlFor="lud16" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Lightning Address
              </Label>
              <Input
                id="lud16"
                placeholder="you@getalby.com"
                {...register('lud16')}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Link your Lightning Address to receive zaps
              </p>
              {errors.lud16 && (
                <p className="text-xs text-red-500">{errors.lud16.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
