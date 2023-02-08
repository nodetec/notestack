"use client";

import {
  createContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

export const ProfileContext = createContext<{
  profile: {};
  setProfile: Dispatch<SetStateAction<object>>;
}>({
  profile: {},
  setProfile: () => {},
});

const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState({});

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
