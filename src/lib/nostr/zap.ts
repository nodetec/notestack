import { getZapEndpoint } from 'nostr-tools/nip57';
import type { NostrEvent } from './types';

export interface InvoiceResponse {
  pr: string;
}

export interface ZapRequest {
  recipientPubkey: string;
  amount: number; // in millisats
  relays: string[];
  comment?: string;
  senderPubkey?: string;
  eventId?: string;
  address?: string; // for articles: "30023:pubkey:d-tag"
}

interface UnsignedEvent {
  kind: number;
  pubkey: string;
  created_at: number;
  tags: string[][];
  content: string;
}

function getTag(name: string, tags: string[][]): string | undefined {
  return tags.find((t) => t[0] === name)?.[1];
}

export function makeZapRequest(zapRequest: ZapRequest): Omit<UnsignedEvent, 'pubkey'> {
  const {
    recipientPubkey,
    amount,
    relays,
    comment,
    senderPubkey,
    eventId,
    address,
  } = zapRequest;

  if (!amount) throw new Error('Amount not provided');
  if (!recipientPubkey) throw new Error('Recipient pubkey not provided');
  if (!relays || relays.length === 0) throw new Error('Relays not provided');

  const tags: string[][] = [
    ['p', recipientPubkey],
    ['amount', amount.toString()],
    ['relays', ...relays],
  ];

  if (eventId) {
    tags.push(['e', eventId]);
  }

  if (address) {
    tags.push(['a', address]);
  }

  if (senderPubkey) {
    tags.push(['P', senderPubkey]);
  }

  return {
    kind: 9734,
    created_at: Math.floor(Date.now() / 1000),
    content: comment ?? '',
    tags,
  };
}

export async function weblnConnect(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.webln) {
      await window.webln.enable();
      return true;
    }
    return false;
  } catch (e) {
    console.error('WebLN connection failed:', e);
    return false;
  }
}

export async function fetchInvoice(
  zapEndpoint: string,
  zapRequestEvent: NostrEvent
): Promise<string> {
  const comment = zapRequestEvent.content;
  const amount = getTag('amount', zapRequestEvent.tags);

  if (!amount) throw new Error('Amount not found in zap request');

  let url = `${zapEndpoint}?amount=${amount}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent)
  )}`;

  if (comment) {
    url = `${url}&comment=${encodeURIComponent(comment)}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch invoice: ${res.status}`);
  }

  const data = (await res.json()) as InvoiceResponse;

  if (!data.pr) {
    throw new Error('No invoice returned from LNURL endpoint');
  }

  return data.pr;
}

export async function payInvoice(invoice: string): Promise<{ preimage: string }> {
  const connected = await weblnConnect();

  if (!connected) {
    throw new Error('WebLN not available. Please install a Lightning wallet extension like Alby.');
  }

  const webln = window.webln;

  if (!webln) {
    throw new Error('WebLN not available');
  }

  const paymentResponse = await webln.sendPayment(invoice);

  if (!paymentResponse) {
    throw new Error('Payment failed - no response');
  }

  return paymentResponse;
}

export async function sendZap(
  zapRequest: ZapRequest,
  profileEvent: NostrEvent
): Promise<{ preimage: string }> {
  if (!window.nostr) {
    throw new Error('No Nostr extension found. Please install a Nostr signer like nos2x or Alby.');
  }

  // Create the unsigned zap request
  const zapRequestTemplate = makeZapRequest(zapRequest);

  // Get sender pubkey and sign with NIP-07
  const pubkey = await window.nostr.getPublicKey();

  const unsignedEvent: UnsignedEvent = {
    ...zapRequestTemplate,
    pubkey,
  };

  const signedEvent = (await window.nostr.signEvent(unsignedEvent)) as NostrEvent;

  if (!signedEvent) {
    throw new Error('Failed to sign zap request');
  }

  // Get the zap endpoint from the recipient's profile
  const zapEndpoint = await getZapEndpoint(profileEvent);

  if (!zapEndpoint) {
    throw new Error('No Lightning address found on recipient profile');
  }

  // Fetch the invoice from the LNURL endpoint
  const invoice = await fetchInvoice(zapEndpoint, signedEvent);

  if (!invoice) {
    throw new Error('Failed to get invoice from LNURL endpoint');
  }

  // Pay the invoice via WebLN
  return payInvoice(invoice);
}
