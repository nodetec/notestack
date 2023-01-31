"use client";

import { useState } from "react";

const Account = () => {
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
    <div className="flex flex-col gap-2">
      <Item title="Name" value={newName} />
    </div>
  );
};

const Item = ({ title, value }: { title: string; value: string }) => (
  <button className="w-full flex items-center gap-2 justify-between text-sm">
    <h3>{title}</h3>
    <span className="text-gray hover:text-gray-hover">{value}</span>
  </button>
);

export default Account;
