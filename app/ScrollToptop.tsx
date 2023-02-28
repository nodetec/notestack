"use client";
import { useEffect, useState } from "react";
import Button from "./Button";
import { ChevronUp } from "./icons";
import useLocalStorage from "./hooks/useLocalStorage";

const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  const [darkTheme] = useLocalStorage("darkTheme", false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    document.addEventListener("scroll", handleScroll);

    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    //restore theme from localstorage
    document.documentElement.dataset.colorMode = darkTheme ? "dark" : "light";
    //eslint-disable-next-line
  }, []);

  if (!show) return null;

  return (
    <Button
      className="fixed bottom-4 right-4 animate-slide-down"
      icon={<ChevronUp />}
      onClick={() => window.scrollTo(0, 0)}
    />
  );
};

export default ScrollToTop;
