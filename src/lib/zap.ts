import { getUser } from "~/server/auth";
import { finishEventWithSecretKey } from "~/server/nostr";
import { type Event, type EventTemplate } from "nostr-tools";
import { getZapEndpoint } from "nostr-tools/nip57";

import { finishEventWithExtension, getTag } from "./nostr";

export interface InvoiceResponse {
  pr: string;
}

export type ZapRequest = {
  recipientPubkey: string;
  amount: number;
  relays: string[];
  comment?: string;
  senderPubkey?: string;
  eventId?: string | null;
  address?: string;
  lnurl?: string;
};

export function makeZapRequest(zapRequest: ZapRequest) {
  const {
    recipientPubkey,
    amount,
    relays,
    comment,
    senderPubkey,
    eventId,
    address,
    lnurl,
  } = zapRequest;

  if (!amount) throw new Error("amount not given");
  if (!recipientPubkey) throw new Error("profile not given");
  if (!relays) throw new Error("relays not given");

  const zr: EventTemplate = {
    kind: 9734,
    created_at: Math.round(Date.now() / 1000),
    content: comment ?? "",
    tags: [
      ["p", recipientPubkey],
      ["amount", amount.toString()],
      ["relays", ...relays],
    ],
  };

  if (eventId) {
    zr.tags.push(["e", eventId]);
  }

  if (address) {
    zr.tags.push(["a", address]);
  }

  if (lnurl) {
    zr.tags.push(["lnurl", lnurl]);
  }

  if (senderPubkey) {
    zr.tags.push(["P", senderPubkey]);
  }

  return zr;
}

const weblnConnect = async () => {
  try {
    if (typeof window.webln !== "undefined") {
      await window.webln.enable();
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

const fetchInvoice = async (zapEndpoint: string, zapRequestEvent: Event) => {
  const comment = zapRequestEvent.content;
  const amount = getTag("amount", zapRequestEvent.tags);
  if (!amount) throw new Error("amount not found");

  let url = `${zapEndpoint}?amount=${amount}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}`;

  if (comment) {
    url = `${url}&comment=${encodeURIComponent(comment)}`;
  }

  const res = await fetch(url);
  const { pr: invoice } = (await res.json()) as InvoiceResponse;

  return invoice;
};

const payInvoice = async (invoice: string) => {
  const weblnConnected = await weblnConnect();
  if (!weblnConnected) throw new Error("webln not available");

  const webln = window.webln;

  if (!webln) throw new Error("webln not available");

  const paymentRequest = invoice;

  const paymentResponse = await webln.sendPayment(paymentRequest);

  if (!paymentResponse) throw new Error("payment response not found");

  return paymentResponse;
};

export const sendZap = async (zapRequest: ZapRequest, profileEvent: Event) => {
  const zapRequestEventTemplate = makeZapRequest(zapRequest);

  let zapRequestEvent;

  const user = await getUser();

  if (user?.secretKey === "0") {
    zapRequestEvent = await finishEventWithExtension(zapRequestEventTemplate);
  } else {
    if (user?.secretKey) {
      zapRequestEvent = await finishEventWithSecretKey(zapRequestEventTemplate);
    } else {
      console.error("User not found");
      return false;
    }
  }

  if (!zapRequestEvent) throw new Error("zap request event not created");

  // this needs to be a profile event
  const zapEndpoint = await getZapEndpoint(profileEvent);

  if (!zapEndpoint) throw new Error("zap endpoint not found");

  const invoice = await fetchInvoice(zapEndpoint, zapRequestEvent);

  if (!invoice) throw new Error("invoice not found");

  console.log("invoice", invoice);

  try {
    return await payInvoice(invoice);
  } catch (err) {
    console.error(err);
    throw new Error("zap failed");
  }
};
