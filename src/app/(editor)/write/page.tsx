"use client";

import { useEffect, useState } from "react";

import { Editor } from "~/features/editor";

export default function WritePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <div>{isClient && <Editor />}</div>;
}
