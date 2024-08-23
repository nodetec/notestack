import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { publishUserRelays } from "~/lib/nostr";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const relayFormSchema = z.object({
  relays: z
    .array(
      z.object({
        url: z
          .string()
          .url({ message: "Please enter a valid URL." })
          .refine((url) => url.startsWith("wss://"), {
            message: "URL must begin with wss://",
          }),
        read: z.boolean().optional(),
        write: z.boolean().optional(),
      }),
    )
    .default([{ url: "", read: true, write: true }]),
});

type RelayFormValues = z.infer<typeof relayFormSchema>;

type Props = {
  defaultValues: Partial<RelayFormValues>;
};

export function RelayForm({ defaultValues }: Props) {
  const form = useForm<RelayFormValues>({
    resolver: zodResolver(relayFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    name: "relays",
    control: form.control,
  });

  const queryClient = useQueryClient();

  async function onSubmit(data: RelayFormValues) {
    let hasError = false;

    data.relays.forEach((relay, index) => {
      if (!relay.read && !relay.write) {
        form.setError(`relays.${index}.read`, {
          type: "manual",
          message: "At least one switch must be set to true.",
        });
        form.setError(`relays.${index}.write`, {
          type: "manual",
          // message: "At least one switch must be set to true.",
        });
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }

    const readRelayUrls = data.relays
      .filter((relay) => relay.read)
      .map((relay) => relay.url);
    const writeRelayUrls = data.relays
      .filter((relay) => relay.write)
      .map((relay) => relay.url);

    const published = await publishUserRelays(readRelayUrls, writeRelayUrls);

    if (published) {
      toast("Relays updated", {
        description: "Your relays have been updated.",
      });
      await queryClient.invalidateQueries({ queryKey: ["userRelays"] });
    } else {
      toast("Relays failed to update", {
        description: "There was an error updating your relays.",
      });
    }
  }

  function removeRelay(e: React.MouseEvent<HTMLButtonElement>, index: number) {
    e.preventDefault();
    if (fields.length === 1) return;
    remove(index);
  }

  function appendRelay(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    // check if the last relay has a URL
    // if it doesn't, don't append a new relay
    const lastRelay = fields[fields.length - 1];
    if (!lastRelay?.url) return;

    append({ url: "", read: true, write: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex w-full flex-col gap-6">
          {fields.map((field, index) => (
            <div
              className="flex flex-col rounded-lg border-foreground/10 p-6 sm:border"
              key={field.id}
            >
              <div className="mb-8">
                <FormField
                  control={form.control}
                  name={`relays.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-1">Relay URL</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-muted"
                          placeholder="wss://relay.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between">
                  <div className="flex gap-6 px-1">
                    <FormField
                      control={form.control}
                      name={`relays.${index}.read`}
                      render={({ field }) => (
                        <FormItem className="flex justify-center gap-2">
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FormLabel>Read</FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`relays.${index}.write`}
                      render={({ field }) => (
                        <FormItem className="flex justify-center gap-2">
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FormLabel>Write</FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    onClick={(e) => removeRelay(e, index)}
                    className="bg-accent hover:bg-foreground/20"
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
                <FormMessage className="mt-4">
                  {form.formState.errors.relays?.[index]?.read?.message}
                </FormMessage>
              </div>
              <Separator className="mt-16 sm:hidden" />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="mt-2 bg-accent hover:bg-foreground/20 sm:w-24"
            onClick={appendRelay}
          >
            Add Relay
          </Button>
        </div>
        <Button className="w-full sm:w-24" type="submit">
          Save
        </Button>
      </form>
    </Form>
  );
}
