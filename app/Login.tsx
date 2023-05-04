"use client";
import { useContext, useEffect, useState } from "react";
import Popup from "./Popup";

import Button from "./Button";
import AccountButton from "./AccountButton";

import { KeysContext } from "./context/keys-provider.jsx";
import { ChevronUp } from "./icons";
import More from "./icons/More";
import { Cogwheel } from "./icons/Cogwheel";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Login() {
  // @ts-ignore
  const { keys, setKeys } = useContext(KeysContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isLightningConnected, setIsLightningConnected] = useState(false);
  const [skipGetAlby, setSkipGetAlby] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const shouldReconnect = localStorage.getItem("shouldReconnect");

    const getConnected = async (shouldReconnect: string) => {
      let enabled = false;

      if (typeof window.nostr === "undefined") {
        return;
      }

      if (shouldReconnect === "true") {
        const publicKey = await nostr.getPublicKey();
        // console.log("public key", publicKey);
        setKeys({ privateKey: "", publicKey: publicKey });
      }

      if (typeof window.webln === "undefined") {
        return;
      }

      if (shouldReconnect === "true" && !webln.executing) {
        try {
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
    if (typeof window.nostr !== "undefined") {
      const publicKey = await nostr.getPublicKey();
      // console.log("public key", publicKey);
      setKeys({ privateKey: "", publicKey: publicKey });
      localStorage.setItem("shouldReconnect", "true");
    }

    if (typeof window.webln !== "undefined") {
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
        <>
          <Button variant="outline" onClick={handleClick} size="sm">
            login
          </Button>
          {pathname !== "/settings" && (
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                {/* <More /> */}
                <Cogwheel />
              </Button>
            </Link>
          )}
        </>
      )}

      <Popup title="Login" isOpen={isOpen} setIsOpen={setIsOpen}>
        {typeof window !== "undefined" &&
        !skipGetAlby &&
        typeof window.nostr === "undefined" ? (
          <div>
            <div className="text-center flex flex-col items-center gap-4 pt-2 pb-4">
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
            <div className="flex items-center gap-4 justify-between">
              <a
                className="font-bold underline text-black text-sm"
                target="_blank"
                rel="noopener noreferrer"
                href="https://guides.getalby.com/overall-guide/alby-browser-extension/features/nostr"
              >
                Learn more
              </a>
              <Button
                variant="ghost"
                size="xs"
                className="font-bold text-sm"
                iconAfter
                icon={<ChevronUp className="rotate-90" />}
                onClick={() => setSkipGetAlby(true)}
              >
                skip
              </Button>
            </div>
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
