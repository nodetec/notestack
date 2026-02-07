"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchProfileEvent } from "@/lib/nostr/profiles";
import {
  parseProfileContent,
  publishProfile,
  type ProfileContent,
} from "@/lib/nostr/profile";

const profileFormSchema = z.object({
  name: z.string().max(30, "Username must be 30 characters or less").optional(),
  picture: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  about: z.string().max(160, "Bio must be 160 characters or less").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  lud16: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkey: string | null;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  pubkey,
}: EditProfileDialogProps) {
  const relays = useSettingsStore((state) => state.relays);
  const { secretKey } = useAuth();
  const queryClient = useQueryClient();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ProfileContent | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      picture: "",
      about: "",
      website: "",
      lud16: "",
    },
  });

  const pictureUrl = watch("picture");

  useEffect(() => {
    if (!open || !pubkey) return;

    let cancelled = false;
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const profileEvent = await fetchProfileEvent(pubkey, relays[0]);
        if (cancelled) return;
        if (!profileEvent) {
          setExistingProfile(null);
          reset({
            name: "",
            picture: "",
            about: "",
            website: "",
            lud16: "",
          });
          return;
        }

        const content = parseProfileContent(profileEvent);
        setExistingProfile(content);
        reset({
          name: typeof content.name === "string" ? content.name : "",
          picture: typeof content.picture === "string" ? content.picture : "",
          about: typeof content.about === "string" ? content.about : "",
          website: typeof content.website === "string" ? content.website : "",
          lud16: typeof content.lud16 === "string" ? content.lud16 : "",
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch profile:", error);
          toast.error("Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [open, pubkey, relays, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!pubkey) return;

    setIsSubmitting(true);
    try {
      const content: ProfileContent = {
        ...existingProfile,
        name: data.name || undefined,
        picture: data.picture || undefined,
        about: data.about || undefined,
        website: data.website || undefined,
        lud16: data.lud16 || undefined,
      };

      Object.keys(content).forEach((key) => {
        if (content[key] === undefined || content[key] === "") {
          delete content[key];
        }
      });

      const results = await publishProfile(content, relays, secretKey);
      const successCount = results.filter((r) => r.success).length;

      if (successCount === 0) {
        toast.error("Failed to update profile", {
          description: "Could not publish to any relay",
        });
        return;
      }

      toast.success("Profile updated", {
        description: `Published to ${successCount} of ${results.length} relays`,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to publish profile:", error);
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your Nostr profile metadata and publish it to your configured
            relays.
          </DialogDescription>
        </DialogHeader>

        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            id="edit-profile-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Username
              </Label>
              <Input id="name" placeholder="satoshi" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="picture"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Picture URL
              </Label>
              <div className="flex items-center gap-3">
                {pictureUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pictureUrl}
                    alt="Avatar preview"
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <Input
                  id="picture"
                  placeholder="https://..."
                  {...register("picture")}
                />
              </div>
              {errors.picture && (
                <p className="text-xs text-red-500">{errors.picture.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="about"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Bio
              </Label>
              <Textarea
                id="about"
                placeholder="Tell us a little bit about yourself"
                {...register("about")}
                className="resize-none min-h-20"
              />
              {errors.about && (
                <p className="text-xs text-red-500">{errors.about.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="website"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Website
              </Label>
              <Input
                id="website"
                placeholder="https://..."
                {...register("website")}
              />
              {errors.website && (
                <p className="text-xs text-red-500">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="lud16"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Lightning Address
              </Label>
              <Input
                id="lud16"
                placeholder="you@getalby.com"
                {...register("lud16")}
              />
              <p className="text-xs text-muted-foreground">
                Link your Lightning Address to receive zaps.
              </p>
              {errors.lud16 && (
                <p className="text-xs text-red-500">{errors.lud16.message}</p>
              )}
            </div>
          </form>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting || isLoadingProfile}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
