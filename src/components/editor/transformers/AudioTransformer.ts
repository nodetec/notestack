import type { ElementTransformer } from '@lexical/markdown';
import { $createParagraphNode, type ElementNode, type LexicalNode } from 'lexical';
import { $createAudioNode, $isAudioNode, AudioNode } from '../nodes/AudioNode';

const AUDIO_URL_REGEX = /^(https?:\/\/\S+\.(mp3|wav|m4a|ogg|flac|aac)(\?\S*)?)$/i;

export const AUDIO_TRANSFORMER: ElementTransformer = {
  dependencies: [AudioNode],
  export: (node: LexicalNode) => {
    if (!$isAudioNode(node)) {
      return null;
    }
    return node.getUrl();
  },
  regExp: AUDIO_URL_REGEX,
  replace: (parentNode: ElementNode, _children: LexicalNode[], match: string[]) => {
    const url = match[0];
    if (!url || !AUDIO_URL_REGEX.test(url)) {
      return;
    }
    const audioNode = $createAudioNode({ url });
    const paragraph = $createParagraphNode();
    paragraph.append(audioNode);
    parentNode.replace(paragraph);
  },
  type: 'element',
};
