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
  // Match both with and without nostr: prefix, require space or start before
  importRegExp: /(^|[\s])(?:nostr:)?(npub1[a-z0-9]{58})/i,
  regExp: /(^|[\s])(?:nostr:)?(npub1[a-z0-9]{58})$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const npub = match[2];
    const isEmbed = fullMatch.toLowerCase().includes('nostr:');
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
  // nprofile has variable length (contains pubkey + optional relays), require space or start before
  importRegExp: /(^|[\s])(?:nostr:)?(nprofile1[a-z0-9]+)/i,
  regExp: /(^|[\s])(?:nostr:)?(nprofile1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const nprofile = match[2];
    const isEmbed = fullMatch.toLowerCase().includes('nostr:');
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
  // nevent has variable length (contains event id + optional relays/author), require space or start before
  importRegExp: /(^|[\s])(?:nostr:)?(nevent1[a-z0-9]+)/i,
  regExp: /(^|[\s])(?:nostr:)?(nevent1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const nevent = match[2];
    const isEmbed = fullMatch.toLowerCase().includes('nostr:');
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
  // naddr has variable length (contains kind + pubkey + d-tag + optional relays), require space or start before
  importRegExp: /(^|[\s])(?:nostr:)?(naddr1[a-z0-9]+)/i,
  regExp: /(^|[\s])(?:nostr:)?(naddr1[a-z0-9]+)$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const naddr = match[2];
    const isEmbed = fullMatch.toLowerCase().includes('nostr:');
    const node = $createNaddrNode({ naddr, isEmbed });
    textNode.replace(node);
  },
  type: 'text-match',
};

// Export all Nostr transformers as an array for convenience
export const NOSTR_TRANSFORMERS = [NPUB, NPROFILE, NEVENT, NADDR];
