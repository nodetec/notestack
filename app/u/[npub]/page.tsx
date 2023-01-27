"use client";

import Profile from "@/app/components/profile/Profile";
import { usePathname } from "next/navigation";

export default function ProfilePage() {
  const pathname = usePathname();

  if (pathname) {
    const npub = pathname.split("/").pop() || "";
    return <Profile npub={npub} />;
  } else {
    return <p>Profile not found</p>;
  }
}

