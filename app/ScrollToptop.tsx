"use client";
import { useEffect, useState } from "react";
import { IoChevronUp } from "react-icons/io5";
import Button from "./Button";

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
      icon={<IoChevronUp />}
      onClick={() => window.scrollTo(0, 0)}
    />
  );
};

export default ScrollToTop;
