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

  if (!isOpen){
    if(typeof document !== "undefined"){
      document.getElementById('blogstack-html')?.classList.remove("overflow-y-hidden");
    }
    return null;
  }
  if(typeof document !== "undefined"){
    document.getElementById('blogstack-html')?.classList.add("overflow-y-hidden");
  }

  return (
    <Fragment>
      <div
        className={`z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[32rem] border-2 bg-white/100 rounded-md ${className}`}
      >
        <Button
          icon={<IoMdClose size={24} />}
          color="transparent"
          variant="ghost"
          className="absolute w-fit right-0 top-0 opacity-70 hover:opacity-100"
          onClick={() => setIsOpen(false)}
        />
        <div className="flex flex-col justify-center items-stretch gap-4 p-10">
          <h3 className="text-xl text-center pb-4">{title}</h3>
          {children}
        </div>
      </div>
      <div
        className="z-40 fixed top-0 left-0 w-full h-full bg-white/90"
        onClick={() => setIsOpen(false)}
      />
    </Fragment>
  );
};

export default Popup;
