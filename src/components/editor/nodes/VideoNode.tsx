"use client";

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import type { ReactNode } from "react";

export type SerializedVideoNode = Spread<
  {
    type: "video";
    version: 1;
    url: string;
    mime?: string;
  },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<ReactNode> {
  __url: string;
  __mime?: string;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__url, node.__mime, node.__key);
  }

  constructor(url: string, mime?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__mime = mime;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      video: () => ({
        conversion: (domNode: HTMLElement) => {
          const video = domNode as HTMLVideoElement;
          const src = video.getAttribute("src");
          const source = video.querySelector("source");
          const sourceSrc = source?.getAttribute("src");
          const url = src || sourceSrc;
          if (!url) {
            return null;
          }
          const mime =
            source?.getAttribute("type") ||
            video.getAttribute("type") ||
            undefined;
          return { node: $createVideoNode({ url, mime }) };
        },
        priority: 1,
      }),
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedVideoNode {
    return {
      type: "video",
      version: 1,
      url: this.__url,
      mime: this.__mime,
    };
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { url, mime } = serializedNode;
    return $createVideoNode({ url, mime });
  }

  exportDOM(): DOMExportOutput {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "true");

    if (this.__mime) {
      const source = document.createElement("source");
      source.src = this.__url;
      source.type = this.__mime;
      video.appendChild(source);
    } else {
      video.src = this.__url;
    }

    return { element: video };
  }

  decorate(): ReactNode {
    return (
      <span className="inline-block align-middle leading-none w-full">
        <video
          controls
          preload="metadata"
          playsInline
          className="block w-full rounded-lg bg-black px-1"
        >
          <source src={this.__url} type={this.__mime ?? "video/mp4"} />
          Your browser does not support the video tag.
        </video>
      </span>
    );
  }

  getUrl(): string {
    return this.__url;
  }

  getTextContent(): string {
    return this.__url;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

export function $createVideoNode({
  url,
  mime,
  key,
}: {
  url: string;
  mime?: string;
  key?: NodeKey;
}): VideoNode {
  return $applyNodeReplacement(new VideoNode(url, mime, key));
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}
