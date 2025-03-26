/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import useAuth from "~/hooks/useAuth";
import { useRelayMetadataEvent } from "~/hooks/useRelayMetadataEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseRelayMetadataEvent } from "~/lib/events/relay-metadata-event";
import { makeNaddr, publish } from "~/lib/nostr";
import { useAppState } from "~/store";
import { SendIcon } from "lucide-react";
import type { Event } from "nostr-tools";

import { redirectToPublishedArticle } from "../lib/redirectToPublishedArticle";
import { parseTitle } from "../markdown/parseTitle";
import { removeTitle } from "../markdown/removeTitle";

function randomId() {
	return Math.floor(Math.random() * 0xffffffff).toString(16);
}

function isValidImage(url: string) {
	return /\.(jpeg|jpg|gif|png)$/.exec(url) != null;
}

const handlePublish = async (
	e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	title: string,
	image: string | undefined,
	tags: string[],
	markdown: string,
	setMarkdown: (markdown: string) => void,
	relayMetadataEvent: Event | undefined | null,
	setIsOpen: (isOpen: boolean) => void,
) => {
	e.preventDefault();

	const identifier = randomId();

	const relays = DEFAULT_RELAYS;

	if (relayMetadataEvent) {
		const relayMetadata = parseRelayMetadataEvent(relayMetadataEvent);
		relays.push(...relayMetadata.relays);
	}

	const eventTags = [
		["d", identifier],
		["title", title],
	];

	if (image && isValidImage(image)) eventTags.push(["image", image]);

	if (tags) {
		for (const tag of tags) {
			eventTags.push(["t", tag]);
		}
	}

	const eventTemplate = {
		kind: 30023,
		created_at: Math.floor(Date.now() / 1000),
		tags: eventTags,
		content: removeTitle(markdown),
	};

	console.log("eventTemplate", eventTemplate);

	const publishedEvent = await publish(eventTemplate, relays);

	if (publishedEvent) {
		const naddr = makeNaddr(publishedEvent, relays);
		setMarkdown("");
		void redirectToPublishedArticle(`a/${naddr}`);
		setIsOpen(false);
	}
};

export function PublishDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	const { userPublicKey } = useAuth();

	const relayMetadataEvent = useRelayMetadataEvent(userPublicKey);

	const markdown = useAppState.getState().markdown;
	const setMarkdown = useAppState.getState().setMarkdown;

	const handleAddTag = () => {
		if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput("");
		}
	};

	const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<div className="flex w-full justify-end">
					<Button
						className="hidden justify-start gap-2 sm:flex"
						type="button"
						variant="default"
						size="sm"
					>
						<SendIcon className="h-4 w-4" />
						Publish
					</Button>
					<Button
						className="sm:hidden"
						type="button"
						variant="default"
						size="icon-sm"
					>
						<SendIcon className="h-4 w-4" />
					</Button>
				</div>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Publish Article</DialogTitle>
					<DialogDescription>Publish to the nostr network.</DialogDescription>
				</DialogHeader>

				<div className="grid gap-12 py-4 md:grid-cols-2">
					<div className="space-y-4">
						<div>
							<h3 className="mb-2 font-semibold">Title:</h3>
							<p className="no-scrollbar cursor-default overflow-x-auto rounded-md bg-secondary px-2 py-1">
								{parseTitle(markdown)}
							</p>
						</div>
						<div>
							<h3 className="mb-2 font-semibold">Author:</h3>
							<p className="no-scrollbar cursor-default overflow-x-auto rounded-md bg-secondary px-2 py-1">
								{userPublicKey}
							</p>
						</div>
						<div>
							<h3 className="mb-2 font-semibold">Tags:</h3>
							<Input
								type="text"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyPress={handleTagInputKeyPress}
								placeholder="Add a tag and press Enter"
							/>
							<div className="mt-2 flex flex-wrap gap-2">
								{tags.map((tag, index) => (
									<Badge className="cursor-default" key={tag} variant="default">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					</div>
					<div className="space-y-4">
						<div>
							<h3 className="mb-2 font-semibold">Image URL:</h3>
							<Input
								type="text"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="Enter image URL"
							/>
						</div>
						<div className="flex flex-col items-center">
							{imageUrl && (
								<img
									src={imageUrl}
									alt="Preview"
									className="mb-2 max-h-48 max-w-full rounded-md"
								/>
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={(e) =>
							handlePublish(
								e,
								parseTitle(markdown),
								imageUrl,
								tags,
								markdown,
								setMarkdown,
								relayMetadataEvent.data,
								setIsOpen,
							)
						}
					>
						Publish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
