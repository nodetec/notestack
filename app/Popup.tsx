import { Fragment, ReactNode, useEffect } from "react";
import { IoMdCloseCircleOutline } from "react-icons/io";
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

  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className={`z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[32rem] border-2 border-tertiary rounded-md overflow-hidden ${className}`}
      >
        <Button
          icon={<IoMdCloseCircleOutline size={24} />}
          className="absolute w-fit right-0 top-0 text-accent opacity-70 hover:opacity-100"
          onClick={() => setIsOpen(false)}
          color="transparent"
        />
        <div className="bg-primary flex flex-col justify-center items-stretch gap-4 p-10">
          <h3 className="text-xl text-accent text-center pb-4">{title}</h3>
          {children}
        </div>
      </div>
      <div
        className="z-40 fixed top-0 left-0 w-full h-full bg-primary bg-opacity-50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
    </Fragment>
  );
};

export default Popup;
