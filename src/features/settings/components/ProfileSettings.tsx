"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useProfileEvent } from "~/hooks/useProfileEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { publish } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import Image from "next/image";
import { type EventTemplate } from "nostr-tools";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const profileFormSchema = z.object({
  picture: z.string(),
  username: z
    .string()
    .min(1, {
      message: "Username must be at least 1 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  website: z.string(),
  bio: z.string().max(160).min(4),
  lud16: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Props = {
  publicKey: string;
};

export function ProfileSettings({ publicKey }: Props) {
  const { data: profileEvent, status } = useProfileEvent(
    DEFAULT_RELAYS,
    publicKey,
  );

  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      picture: "",
      username: "",
      website: "",
      bio: "",
      lud16: "",
    },
    mode: "onChange",
  });

  const { reset } = form;

  useEffect(() => {
    if (profileEvent) {
      const profile = parseProfileEvent(profileEvent);
      reset({
        picture: profile?.content.picture,
        username: profile?.content.name,
        website: profile?.content.website,
        bio: profile?.content.about,
        lud16: profile?.content.lud16,
      });
    }
  }, [reset, profileEvent]);

  async function onSubmit(data: ProfileFormValues) {
    const { picture, username, website, bio, lud16 } = data;

    let tags = profileEvent?.tags;

    if (!tags) tags = [];

    let content = "";
    let profile;

    if (profileEvent) {
      profile = parseProfileEvent(profileEvent);
      profile.content.picture = picture;
      profile.content.name = username;
      profile.content.website = website;
      profile.content.about = bio;
      profile.content.lud16 = lud16;
    }

    if (!profile) {
      content = JSON.stringify({
        picture,
        name: username,
        website,
        about: bio,
        lud16,
      });
    } else {
      content = JSON.stringify(profile.content);
    }

    const eventTemplate: EventTemplate = {
      kind: 0,
      tags,
      content,
      created_at: Math.floor(Date.now() / 1000),
    };

    setIsSubmitting(true);

    // TODO: publish to the user's relays
    const published = await publish(eventTemplate, DEFAULT_RELAYS);

    setIsSubmitting(false);

    if (published) {
      toast("Profile updated", {
        description: "Your profile has been updated.",
      });
      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    } else {
      toast("Profile update failed", {
        description: "There was an error updating your profile.",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-xl space-y-8"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="satoshi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-x-4">
                {field.value ? (
                  <Image
                    className="aspect-square w-12 overflow-hidden rounded-full object-cover"
                    src={field.value || "/favicon/favicon-32x32.png"}
                    width={48}
                    height={48}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <Image
                    className="aspect-square w-12 overflow-hidden rounded-full object-cover"
                    src={getAvatar(publicKey)}
                    width={48}
                    height={48}
                    alt=""
                    loading="lazy"
                  />
                )}

                <div className="flex w-full flex-col gap-2">
                  <FormLabel>Picture URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Manage integrations with external services.
          </p>
        </div>
        <FormField
          control={form.control}
          name="lud16"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lightning Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Link your Lightning Address to your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {isClient && (
          <Button disabled={isSubmitting || status === "pending"} type="submit">
            Update profile
          </Button>
        )}
      </form>
    </Form>
  );
}
