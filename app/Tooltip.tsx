"use client";
import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

interface TooltipProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  Component: JSX.Element;
  direction?: "top" | "bottom";
  showOnHover?: boolean;
  show: boolean;
  toggle: () => void;
}

const DIRECTIONS = {
  top: "-top-4 -translate-y-full",
  bottom: "-bottom-4 translate-y-full",
};

const ArrowShadow = {
  top: "before:-top-6",
  bottom: "before:-bottom-6",
};

const ArrowBorder = {
  top: "before:-bottom-2 before:border-b before:border-b-light-gray before:border-r before:border-r-light-gray",
  bottom:
    "before:-top-2 before:border-t before:border-t-light-gray before:border-l before:border-l-light-gray",
};

const Tooltip: FC<TooltipProps> = ({
  children,
  Component,
  showOnHover,
  show,
  toggle,
  direction = "top",
}) => {
  return (
    <div
      className={`relative group
      before:absolute before:z-0 before:w-4 before:h-4 before:rotate-45 before:bg-white before:left-1/2 before:-translate-x-1/2 before:shadow-profile-menu
      ${
        showOnHover
          ? "before:invisible group-hover:before:visible"
          : show
          ? "before:visible"
          : "before:invisible"
      }
      ${ArrowShadow[direction]}`}
    >
      <div onClick={toggle}>{Component}</div>
      <div
        className={`bg-white absolute mx-auto left-1/2 -translate-x-1/2 p-4 z-20 rounded-md shadow-profile-menu border-light-gray border text-sm break-all
            before:absolute before:w-4 before:h-4 before:rotate-45 before:bg-white before:left-1/2 before:-translate-x-1/2 ${
              ArrowBorder[direction]
            }
            ${
              showOnHover
                ? "invisible group-hover:visible"
                : show
                ? "visible"
                : "invisible"
            }
            ${DIRECTIONS[direction]}`}
      >
        {children}
      </div>
      {show ? <div className="fixed inset-0 z-10" onClick={toggle} /> : null}
    </div>
  );
};

export default Tooltip;
