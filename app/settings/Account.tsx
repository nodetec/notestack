"use client";

import Popup from "@/app/Popup";
import { Fragment, useState } from "react";

const Account = () => {
  const [popup, setPopup] = useState("");
  const [profile, setProfile] = useState({
    newName: "test",
  });
  const { newName } = profile;

  return (
    <Fragment>
      <div className="flex flex-col gap-2">
        <Item title="Name" value={newName} onClick={() => setPopup("name")} />
      </div>
      <Popup
        title="Name"
        isOpen={popup === "name"}
        setIsOpen={() => setPopup("")}
      ></Popup>
    </Fragment>
  );
};

const Item = ({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick: () => void;
}) => (
  <button
    className="w-full flex items-center gap-2 justify-between text-sm"
    onClick={onClick}
  >
    <h3>{title}</h3>
    <span className="text-gray hover:text-gray-hover">{value}</span>
  </button>
);

export default Account;
