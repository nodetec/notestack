import { Fragment, ReactNode, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import Button from "./Button";

export interface PopupProps {
  title: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
  children?: ReactNode;
}

const Popup = ({
  title,
  isOpen,
  setIsOpen,
  className,
  children,
}: PopupProps) => {
  useEffect(() => {
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.documentElement.addEventListener("keyup", handleKeyup);

    return () => {
      document.documentElement.removeEventListener("keyup", handleKeyup);
    };
  }, [setIsOpen]);

  if (!isOpen) {
    if (typeof document !== "undefined") {
      document.body.className = "font-main";
    }
    return null;
  }
  if (typeof document !== "undefined") {
    document.body.className = "overflow-hidden font-main";
  }

  return (
    <Fragment>
      <div
        className={`z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[32rem] bg-white border border-light-gray shadow-popup text-gray-hover rounded-md ${className}`}
      >
        <div className="flex flex-col justify-center items-stretch gap-4 px-10 py-10 pt-8">
          <div className="flex justify-between gap-4">
            <h3 className="text-xl font-bold pb-4">{title}</h3>
            <Button
              icon={<IoMdClose size={20} />}
              color="transparent"
              variant="ghost"
              className="w-fit translate-x-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
              onClick={() => setIsOpen(false)}
            />
          </div>
          {children}
        </div>
      </div>
      <div
        className="z-40 fixed top-0 left-0 w-full h-full bg-black/20"
        onClick={() => setIsOpen(false)}
      />
    </Fragment>
  );
};

export default Popup;
