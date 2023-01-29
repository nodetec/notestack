"use client";
import { DetailedHTMLProps, FC, HTMLAttributes, useState } from "react";

interface TooltipProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  Component: JSX.Element;
  direction?: "top" | "bottom";
  showOn?: "hover" | "click";
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
  showOn = "hover",
  direction = "top",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className={`relative group
      before:absolute before:z-0 before:w-4 before:h-4 before:rotate-45 before:bg-white before:left-1/2 before:-translate-x-1/2 before:shadow-profile-menu
      ${showOn === "hover" ? "before:invisible group-hover:before:visible" : ""}
      ${showOn === "click"
          ? showTooltip
            ? "before:visible"
            : "before:invisible"
          : ""
        }
      ${ArrowShadow[direction]}`}
    >
      <div onClick={() => setShowTooltip((current) => !current)}>
        {Component}
      </div>
      <div
        className={`bg-white absolute mx-auto left-1/2 -translate-x-1/2 p-4 z-20 rounded-md shadow-profile-menu border-light-gray border text-sm break-all
            before:absolute before:w-4 before:h-4 before:rotate-45 before:bg-white before:left-1/2 before:-translate-x-1/2 ${ArrowBorder[direction]
          }
            ${showOn === "hover" ? "invisible group-hover:visible" : ""}
            ${showOn === "click" ? (showTooltip ? "visible" : "invisible") : ""}
            ${DIRECTIONS[direction]}`}
      >
        {children}
      </div>
      {showOn === "click" && showTooltip ? (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTooltip(false)}
        />
      ) : null}
    </div>
  );
};

export default Tooltip;
