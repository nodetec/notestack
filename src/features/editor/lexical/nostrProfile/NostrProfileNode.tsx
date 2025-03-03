/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { type JSX } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useProfileEvent } from "~/hooks/useProfileEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseProfileEvent } from "~/lib/events/profile-event";
import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { nip19 } from "nostr-tools";

const shortNpub = (npub: string | undefined, length = 4) => {
  if (!npub) {
    return undefined;
  }
  return `npub...${npub.substring(npub.length - length)}`;
};

export interface ProfileData {
  npub: string;
  name?: string;
  picture?: string;
  displayName?: string;
}

interface ProfileComponentProps {
  profileData: ProfileData;
  nodeKey: NodeKey;
}

// This will be the React component that renders in the editor
function ProfileComponent({ profileData }: ProfileComponentProps) {
  const publicKey = nip19.decode(profileData.npub).data as string;
  const profileEvent = useProfileEvent(DEFAULT_RELAYS, publicKey);

  return (
    <HoverCard>
      <span className="cursor-pointer text-blue-500 hover:underline">
        {profileEvent.data !== undefined ? (
          profileEvent.data ? (
            <>
              <HoverCardTrigger asChild>
                <span className="text-blue-500">
                  <a href={`/${profileData.npub}`}>
                    @{parseProfileEvent(profileEvent.data).content.name}
                  </a>
                </span>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={parseProfileEvent(profileEvent.data).content.picture}
                      alt="Profile"
                    />
                    <span>
                      {parseProfileEvent(profileEvent.data).content.name}
                    </span>
                  </div>
                  <div>{shortNpub(profileData.npub)}</div>
                  <div>
                    website:{" "}
                    {parseProfileEvent(profileEvent.data).content.website}
                  </div>
                  {parseProfileEvent(profileEvent.data).content.nip05 && (
                    <div>
                      nip05:{" "}
                      {parseProfileEvent(profileEvent.data).content.nip05}
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </>
          ) : (
            <HoverCardTrigger asChild>
              <span className="text-blue-500">
                <a href={`/${profileData.npub}`}>
                  <span className="text-blue-500">
                    {shortNpub(profileData.npub)}
                  </span>
                </a>
              </span>
            </HoverCardTrigger>
          )
        ) : (
          <>...</>
        )}
      </span>
    </HoverCard>
  );
}

export type SerializedProfileNode = Spread<
  {
    npub: string;
  },
  SerializedLexicalNode
>;

export class ProfileNode extends DecoratorNode<JSX.Element> {
  __npub: string;

  static getType(): string {
    return "profile";
  }

  static clone(node: ProfileNode): ProfileNode {
    return new ProfileNode(node.__npub, node.__key);
  }

  constructor(npub: string, key?: NodeKey) {
    super(key);
    this.__npub = npub;
  }

  static importJSON(serializedNode: SerializedProfileNode): ProfileNode {
    return $createProfileNode(serializedNode.npub);
  }

  exportJSON(): SerializedProfileNode {
    return {
      ...super.exportJSON(),
      npub: this.getNpub(),
    };
  }

  createDOM(): HTMLElement {
    const dom = document.createElement("span");
    dom.className = "profile-node";
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-profile", this.__npub);
    element.textContent = `Profile: ${this.__npub}`;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-profile")) {
          return null;
        }
        return {
          conversion: convertProfileElement,
          priority: 2,
        };
      },
    };
  }

  getTextContent(): string {
    return this.__npub;
  }

  decorate(): JSX.Element {
    const profileData: ProfileData = {
      npub: this.__npub,
    };
    return (
      <ProfileComponent profileData={profileData} nodeKey={this.getKey()} />
    );
  }

  getNpub(): string {
    return this.__npub;
  }
}

function convertProfileElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const npub = domNode.getAttribute("data-lexical-profile");
  if (npub) {
    const node = $createProfileNode(npub);
    return { node };
  }
  return null;
}

export function $createProfileNode(npub: string): ProfileNode {
  return new ProfileNode(npub);
}

export function $isProfileNode(
  node: LexicalNode | null | undefined,
): node is ProfileNode {
  return node instanceof ProfileNode;
}
