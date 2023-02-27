"use client";

import { useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import Switch from "../Switch";
import Item from "./Item";

const Appearance = () => {
  const [zenMode, setZenMode] = useLocalStorage("zenMode", false);
  const [darkTheme, setDarkTheme] = useLocalStorage("darkTheme", false);

  useEffect(() => {
    document.body.dataset.colorMode = darkTheme ? "dark" : "light";
  }, [darkTheme]);

  return (
    <div className="flex flex-col gap-6">
      <Item title="Zen mode" onClick={() => setZenMode((current) => !current)}>
        <Switch checked={zenMode} />
      </Item>
      <Item
        title="Dark theme"
        onClick={() => setDarkTheme((current) => !current)}
      >
        <Switch checked={darkTheme} />
      </Item>
    </div>
  );
};

export default Appearance;
