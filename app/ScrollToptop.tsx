"use client";
import { useEffect, useState } from "react";
import Button from "./Button";
import { ChevronUp } from "./icons";

const ScrollToTop = () => {
  const [show, setShow] = useState(false);

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
