'use client';

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import type { ReactNode } from 'react';

export type SerializedAudioNode = Spread<
  {
    type: 'audio';
    version: 1;
    url: string;
    mime?: string;
  },
  SerializedLexicalNode
>;

export class AudioNode extends DecoratorNode<ReactNode> {
  __url: string;
  __mime?: string;

  static getType(): string {
    return 'audio';
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(node.__url, node.__mime, node.__key);
  }

  constructor(url: string, mime?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__mime = mime;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    return container;
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedAudioNode {
    return {
      type: 'audio',
      version: 1,
      url: this.__url,
      mime: this.__mime,
    };
  }

  static importJSON(serializedNode: SerializedAudioNode): AudioNode {
    const { url, mime } = serializedNode;
    return $createAudioNode({ url, mime });
  }

  exportDOM(): DOMExportOutput {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = this.__url;
    if (this.__mime) {
      audio.type = this.__mime;
    }
    return { element: audio };
  }

  decorate(): ReactNode {
    return (
      <div className="my-4">
        <audio controls preload="metadata" className="w-full">
          <source src={this.__url} type={this.__mime} />
        </audio>
      </div>
    );
  }

  getUrl(): string {
    return this.__url;
  }
}

export function $createAudioNode({
  url,
  mime,
  key,
}: {
  url: string;
  mime?: string;
  key?: NodeKey;
}): AudioNode {
  return new AudioNode(url, mime, key);
}

export function $isAudioNode(node: LexicalNode | null | undefined): node is AudioNode {
  return node instanceof AudioNode;
}
