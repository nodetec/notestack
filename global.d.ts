interface Window {
  nostr: Nostr;
  webln: WebLN;
}

interface Nip04 {
  encrypt(pubkey: string, plaintext: string): Promise<string>;
  decrypt(pubkey, ciphertext): Promise<string>;
}

// https://github.com/nostr-protocol/nips/blob/master/07.md
interface Nostr {
  getPublicKey(): Promise<string>;
  signEvent(event: unknown): Promise<unknown>;
  getRelays(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04: Nip04;
}

interface GetInfoResponse {
  node: {
    alias: string;
    pubkey: string;
    color?: string;
  };
  // Not supported by all connectors (see webln.request for more info)
  methods: string[];
}

interface KeysendArgs {
  destination: string;
  amount: string | number;
  customRecords?: Record<string, string>;
}

interface SendPaymentResponse {
  preimage: string;
  paymentHash: string;
}

interface RequestInvoiceArgs {
  amount?: string | number;
  defaultAmount?: string | number;
  minimumAmount?: string | number;
  maximumAmount?: string | number;
  defaultMemo?: string;
}

interface SignMessageResponse {
  message: string;
  signature: string;
}

// https://www.webln.guide/introduction/readme
interface WebLN {
  enable(): Promise<void>;
  getInfo(): Promise<GetInfoResponse>;
  keysend(args: KeysendArgs): Promise<SendPaymentResponse>;
  makeInvoice(args: RequestInvoiceArgs): Promise<RequestInvoiceResponse>;
  sendPayment(paymentRequest: string): Promise<SendPaymentResponse>;
  signMessage(message: string): Promise<SignMessageResponse>;
  // request(method: string, params: Object): RequestResponse;
  // lnurl(lnurl: string): LNURLResponse;
}

declare const webln: WebLN;
declare const nostr: Nostr;
