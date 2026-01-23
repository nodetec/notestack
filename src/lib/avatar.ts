import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';

/**
 * Generate a DiceBear avatar URL for a given seed (typically a pubkey or npub)
 */
export function generateAvatar(seed: string): string {
  const avatar = createAvatar(identicon, {
    seed,
    size: 64,
  });

  return avatar.toDataUri();
}
