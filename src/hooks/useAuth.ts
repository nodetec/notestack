import { useEffect, useState } from "react";

import { type UserWithKeys } from "~/types";
import { useSession } from "next-auth/react";

const useAuth = () => {
  const [userPublicKey, setUserPublicKey] = useState<string | undefined>(undefined);
  const [userSecretKey, setUserSecretKey] = useState<Uint8Array | undefined>(undefined);
  const { data: session } = useSession();

  const user = session?.user as UserWithKeys;

  useEffect(() => {
    if (session) {
      const user = session?.user as UserWithKeys;

      // Only update publicKey if it has changed
      if (user.publicKey !== userPublicKey) {
        setUserPublicKey(user.publicKey);
      }

      if (!user.secretKey) {
        return;
      }

      try {
        const parsedArray = JSON.parse(user.secretKey) as number[];
        const uint8Array = new Uint8Array(parsedArray);

        // Only update secretKey if it has changed
        if (!userSecretKey || !uint8Array.every((val, i) => val === userSecretKey[i])) {
          setUserSecretKey(uint8Array);
        }
      } catch (e) {
        console.error(e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.publicKey]);

  return { userPublicKey, userSecretKey };
};

export default useAuth;
