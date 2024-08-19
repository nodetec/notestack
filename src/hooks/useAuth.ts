import { useEffect, useState } from "react";

import { type UserWithKeys } from "~/types";
import { useSession } from "next-auth/react";

const useAuth = () => {
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
  const [secretKey, setSecretKey] = useState<Uint8Array | undefined>(undefined);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const user = session?.user as UserWithKeys;
      setPublicKey(user.publicKey);
      if (!user.secretKey) {
        return;
      }
      try {
        const parsedArray = JSON.parse(user.secretKey) as number[];
        const uint8Array = new Uint8Array(parsedArray);
        setSecretKey(uint8Array);
      } catch (e) {
        console.error(e);
      }
    }
  }, [session]);

  return { publicKey, secretKey };
};

export default useAuth;
