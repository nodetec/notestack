import type { ElementTransformer } from '@lexical/markdown';
import { $createParagraphNode, type ElementNode, type LexicalNode } from 'lexical';
import { $createVideoNode, $isVideoNode, VideoNode } from '../nodes/VideoNode';

const VIDEO_URL_REGEX = /^\s*(https?:\/\/\S+\.mp4(?:\?\S*)?(?:#\S*)?)\s*$/i;

export const VIDEO_TRANSFORMER: ElementTransformer = {
  dependencies: [VideoNode],
  export: (node: LexicalNode) => {
    if (!$isVideoNode(node)) {
      return null;
    }
    return node.getUrl();
  },
  regExp: VIDEO_URL_REGEX,
  replace: (parentNode: ElementNode, _children: LexicalNode[], match: string[]) => {
    const url = match[1];
    if (!url || !VIDEO_URL_REGEX.test(url)) {
      return;
    }
    const videoNode = $createVideoNode({ url, mime: 'video/mp4' });
    const paragraph = $createParagraphNode();
    paragraph.append(videoNode);
    parentNode.replace(paragraph);
  },
  type: 'element',
};
