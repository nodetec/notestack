"use client";
import { useContext, useEffect, useState } from "react";
import Popup from "./Popup";

import Button from "./Button";
import AccountButton from "./AccountButton";

import { KeysContext } from "./context/keys-provider.jsx";
import Link from "next/link";

export default function Login() {
  // @ts-ignore
  const { keys, setKeys } = useContext(KeysContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isLightningConnected, setIsLightningConnected] = useState(false);
  const [isPublicKeyDefined, setIsPublicKeyDefined] = useState(false);

  useEffect(() => {
    const shouldReconnect = localStorage.getItem("shouldReconnect");

    const getConnected = async (shouldReconnect: string) => {
      let enabled = false;

      // @ts-ignore
      if (typeof window.nostr === "undefined") {
        return;
      }

      if (shouldReconnect === "true") {
        // @ts-ignore
        const publicKey = await nostr.getPublicKey();
        // console.log("public key", publicKey);
        setKeys({ privateKey: "", publicKey: publicKey });
      }

      // @ts-ignore
      if (typeof window.webln === "undefined") {
        return;
      }

      // @ts-ignore
      if (shouldReconnect === "true" && !webln.executing) {
        try {
          // @ts-ignore
          enabled = await window.webln.enable();
          setIsLightningConnected(true);
        } catch (e: any) {
          console.log(e.message);
        }
      }
      return enabled;
    };

    if (shouldReconnect === "true") {
      getConnected(shouldReconnect);
    }
  }, [setKeys]);

  const loginHandler = async () => {
    // @ts-ignore
    if (typeof window.nostr !== "undefined") {
      // @ts-ignore
      const publicKey = await nostr.getPublicKey();
      // console.log("public key", publicKey);
      setKeys({ privateKey: "", publicKey: publicKey });
      localStorage.setItem("shouldReconnect", "true");
    }

    // @ts-ignore
    if (typeof window.webln !== "undefined") {
      // @ts-ignore
      await window.webln.enable();
    }
    console.log("connected ");
    setIsLightningConnected(true);
    setIsOpen(false);
  };

  const handleClick = async () => {
    setIsOpen(true);
  };

  useEffect(() => {
    (async () => {
      // @ts-ignore
      if (typeof window.nostr === "undefined") return false;
      // @ts-ignore
      const publicKey = await nostr.getPublicKey();
      setIsPublicKeyDefined(!!publicKey);
    })();
  }, []);

  return (
    <>
      {isLightningConnected && keys?.publicKey ? (
        <AccountButton pubkey={keys?.publicKey} />
      ) : (
        <Button variant="outline" onClick={handleClick} size="sm">
          login
        </Button>
      )}

      <Popup title="Login" isOpen={isOpen} setIsOpen={setIsOpen}>
        {typeof window !== "undefined" &&
        //@ts-ignore
        typeof window.nostr === "undefined" ? (
          <div className="text-center">
            <p className="mb-4 font-bold">You need Extension to Login</p>
            <Link
              href="https://getalby.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-white block bg-black rounded-full text-sm font-bold py-2 px-4"
            >
              Get Alby Extension
            </Link>
          </div>
        ) : isPublicKeyDefined ? (
          <Button className="w-full font-bold" onClick={loginHandler} size="sm">
            {isLightningConnected ? "connected" : "Login with Extension"}
          </Button>
        ) : (
          <p className="mb-4 font-bold text-center">
            You need to setup Nostr keys form your Extension
          </p>
        )}
      </Popup>
    </>
  );
}
