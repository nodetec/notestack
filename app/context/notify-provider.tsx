"use client";

import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

export const NotifyContext = createContext<{
  notifyMessage: string;
  setNotifyMessage: Dispatch<SetStateAction<string>>;
}>({
  notifyMessage: "",
  setNotifyMessage: () => { },
});

const NotifyProvider = ({ children }: { children: ReactNode }) => {
  const [notifyMessage, setNotifyMessage] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNotifyMessage("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [notifyMessage]);

  return (
    <NotifyContext.Provider value={{ notifyMessage, setNotifyMessage }}>
      {children}
    </NotifyContext.Provider>
  );
};

export default NotifyProvider;
