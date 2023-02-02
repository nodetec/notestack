"use client";

import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

const initialProfile = {
  name: "",
  setProfile: () => {},
};

export const ProfileContext = createContext<{
  name: string;
  setProfile: Dispatch<SetStateAction<typeof initialProfile>>;
}>(initialProfile);

const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState(initialProfile);
  const { name } = profile;

  return (
    <ProfileContext.Provider value={{ name, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
