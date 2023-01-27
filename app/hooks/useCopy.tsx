import { useState } from "react";

interface ICopy {
  isCopied: boolean;
  isError: boolean;
}

const useCopy = () => {
  const [{ isCopied, isError }, setClipboard] = useState<ICopy>({
    isCopied: false,
    isError: false,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setClipboard({ isCopied: true, isError: false });
      })
      .catch((_) => {
        setClipboard({ isCopied: false, isError: true });
      })
      .finally(() => {
        setTimeout(() => {
          setClipboard({ isCopied: false, isError: false });
        }, 2000);
      });
  };

  return { isCopied, isError, copyToClipboard };
};

export default useCopy;
