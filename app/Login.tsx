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
          <div>
            <div className="text-center flex flex-col items-center gap-4 py-2">
              <p>Install Alby Extension and setup keys to Login</p>
              <a
                href="https://getalby.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-white block bg-black rounded-full text-sm font-bold py-2 px-4"
              >
                Get Alby Extension
              </a>
            </div>
            <a
              className="font-bold underline text-black text-sm text-center block"
              target="_blank"
              rel="noopener noreferrer"
              href="https://guides.getalby.com/overall-guide/alby-browser-extension/features/nostr"
            >
              Learn more
            </a>
          </div>
        ) : (
          <Button className="w-full font-bold" onClick={loginHandler} size="sm">
            {isLightningConnected ? "connected" : "Login with Extension"}
          </Button>
        )}
      </Popup>
    </>
  );
}
