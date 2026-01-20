import type { TextMatchTransformer } from '@lexical/markdown';
import { $createNpubNode, $isNpubNode, NpubNode } from '../nodes/NpubNode';
import { $createNprofileNode, $isNprofileNode, NprofileNode } from '../nodes/NprofileNode';
import { $createNeventNode, $isNeventNode, NeventNode } from '../nodes/NeventNode';
import { $createNaddrNode, $isNaddrNode, NaddrNode } from '../nodes/NaddrNode';

export const NPUB: TextMatchTransformer = {
  dependencies: [NpubNode],
  export: (node) => {
    if (!$isNpubNode(node)) {
      return null;
    }
    const npub = node.getNpub();
    return node.getIsEmbed() ? `nostr:${npub}` : npub;
  },
  // Match both with and without nostr: prefix, capture just the npub part
  importRegExp: /(?:nostr:)?(npub1[a-z0-9]{58})/i,
  regExp: /(?:nostr:)?(npub1[a-z0-9]{58})$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const npub = match[1];
    const isEmbed = fullMatch.toLowerCase().startsWith('nostr:');
    const npubNode = $createNpubNode({ npub, isEmbed });
    textNode.replace(npubNode);
  },
  type: 'text-match',
};

export const NPROFILE: TextMatchTransformer = {
  dependencies: [NprofileNode],
  export: (node) => {
    if (!$isNprofileNode(node)) {
      return null;
    }
    const nprofile = node.getNprofile();
    return node.getIsEmbed() ? `nostr:${nprofile}` : nprofile;
  },
  // nprofile has variable length (contains pubkey + optional relays)
  importRegExp: /(?:nostr:)?(nprofile1[a-z0-9]+)/i,
  regExp: /(?:nostr:)?(nprofile1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const nprofile = match[1];
    const isEmbed = fullMatch.toLowerCase().startsWith('nostr:');
    const node = $createNprofileNode({ nprofile, isEmbed });
    textNode.replace(node);
  },
  type: 'text-match',
};

export const NEVENT: TextMatchTransformer = {
  dependencies: [NeventNode],
  export: (node) => {
    if (!$isNeventNode(node)) {
      return null;
    }
    const nevent = node.getNevent();
    return node.getIsEmbed() ? `nostr:${nevent}` : nevent;
  },
  // nevent has variable length (contains event id + optional relays/author)
  importRegExp: /(?:nostr:)?(nevent1[a-z0-9]+)/i,
  regExp: /(?:nostr:)?(nevent1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const nevent = match[1];
    const isEmbed = fullMatch.toLowerCase().startsWith('nostr:');
    const node = $createNeventNode({ nevent, isEmbed });
    textNode.replace(node);
  },
  type: 'text-match',
};

export const NADDR: TextMatchTransformer = {
  dependencies: [NaddrNode],
  export: (node) => {
    if (!$isNaddrNode(node)) {
      return null;
    }
    const naddr = node.getNaddr();
    return node.getIsEmbed() ? `nostr:${naddr}` : naddr;
  },
  // naddr has variable length (contains kind + pubkey + d-tag + optional relays)
  importRegExp: /(?:nostr:)?(naddr1[a-z0-9]+)/i,
  regExp: /(?:nostr:)?(naddr1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const naddr = match[1];
    const isEmbed = fullMatch.toLowerCase().startsWith('nostr:');
    const node = $createNaddrNode({ naddr, isEmbed });
    textNode.replace(node);
  },
  type: 'text-match',
};

// Export all Nostr transformers as an array for convenience
export const NOSTR_TRANSFORMERS = [NPUB, NPROFILE, NEVENT, NADDR];
