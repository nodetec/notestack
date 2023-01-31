"use client";

import { Fragment, useState } from "react";
import Popup from "../Popup";

const Account = () => {
  const [popup, setPopup] = useState("");
  const [profile, setProfile] = useState({
    newName: "test",
    newNip05: "",
    newNpub: "",
    newAbout: "",
    newPicture: "",
    newProfilePubkey: "",
    newLoggedInContactList: "",
    newLoggedInPubkey: "",
    newLud06: "",
    newLud16: "",
  });
  const {
    newName,
    newNip05,
    newNpub,
    newAbout,
    newPicture,
    newProfilePubkey,
    newLoggedInContactList,
    newLoggedInPubkey,
    newLud06,
    newLud16,
  } = profile;

  return (
    <Fragment>
      <div className="flex flex-col gap-2">
        <Item title="Name" value={newName} onClick={() => setPopup("name")} />
      </div>
      <Popup
        title="Name"
        isOpen={popup === "name"}
        setIsOpen={() => setPopup("")}
      >
        hi
      </Popup>
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
