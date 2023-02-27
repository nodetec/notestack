"use client";

import { Fragment } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import Switch from "../Switch";
import Item from "./Item";

const Appearance = () => {
  const [zenMode, setZenMode] = useLocalStorage("zenMode", false);

  return (
    <Fragment>
      <Item title="Zen mode" onClick={() => setZenMode((current) => !current)}>
        <Switch checked={zenMode} />
      </Item>
    </Fragment>
  );
};

export default Appearance;
