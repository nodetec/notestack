"use client";
import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

interface TooltipProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  Component: JSX.Element;
  direction?: "top" | "bottom";
  showOnHover?: boolean;
  color?: keyof typeof colors;
  size?: keyof typeof sizes;
  show?: boolean;
  toggle?: () => void;
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
  top: "before:-bottom-2 before:border-b before:border-r",
  bottom: "before:-top-2 before:border-t before:border-l",
};

const colors = {
  white: {
    before: "before:bg-white",
    bg: "bg-white text-gray-hover border-light-gray",
    top: "before:border-b-light-gray before:border-r-light-gray",
    bottom: "before:border-t-light-gray before:border-l-light-gray",
  },
  black: {
    before: "before:bg-gray-hover",
    bg: "bg-gray-hover text-white border-gray-hover",
    top: "before:border-b-gray-hover before:border-r-gray-hover",
    bottom: "before:border-t-gray-hover before:border-l-gray-hover",
  },
};

const sizes = {
  md: "p-4",
  sm: "p-2",
};

const Tooltip: FC<TooltipProps> = ({
  children,
  Component,
  showOnHover,
  show,
  toggle,
  size = "md",
  color = "white",
  className = "",
  direction = "top",
}) => {
  return (
    <div
      className={`relative group
      before:absolute before:z-0 before:w-4 before:h-4 before:rotate-45 before:left-1/2 before:-translate-x-1/2 before:shadow-profile-menu
      ${
        showOnHover
          ? "before:invisible group-hover:before:visible"
          : show
          ? "before:visible"
          : "before:invisible"
      }
      ${ArrowShadow[direction]}
      ${colors[color].before}`}
    >
      <div onClick={toggle}>{Component}</div>
      <div
        className={`absolute mx-auto left-1/2 -translate-x-1/2 z-20 rounded-md shadow-profile-menu border text-sm break-all
            before:absolute before:w-4 before:h-4 before:rotate-45 before:left-1/2 before:-translate-x-1/2
            ${ArrowBorder[direction]}
            ${sizes[size]}
            ${colors[color][direction]}
            ${colors[color][direction]}
            ${colors[color].before} ${colors[color].bg}
            ${
              showOnHover
                ? "invisible group-hover:visible"
                : show
                ? "visible"
                : "invisible"
            }
            ${DIRECTIONS[direction]} ${className}`}
      >
        {children}
      </div>
      {show ? <div className="fixed inset-0 z-10" onClick={toggle} /> : null}
    </div>
  );
};

export default Tooltip;
