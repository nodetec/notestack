import { useEffect, useState } from "react";

import { type UserWithKeys } from "~/types";
import { useSession } from "next-auth/react";

const useAuth = () => {
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
  const [secretKey, setSecretKey] = useState<Uint8Array | undefined>(undefined);
  const { data: session } = useSession();

  const user = session?.user as UserWithKeys;

  useEffect(() => {
    if (session) {
      const user = session?.user as UserWithKeys;

      // Only update publicKey if it has changed
      if (user.publicKey !== publicKey) {
        setPublicKey(user.publicKey);
      }

      if (!user.secretKey) {
        return;
      }

      try {
        const parsedArray = JSON.parse(user.secretKey) as number[];
        const uint8Array = new Uint8Array(parsedArray);

        // Only update secretKey if it has changed
        if (!secretKey || !uint8Array.every((val, i) => val === secretKey[i])) {
          setSecretKey(uint8Array);
        }
      } catch (e) {
        console.error(e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.publicKey]);

  return { publicKey, secretKey };
};

export default useAuth;
