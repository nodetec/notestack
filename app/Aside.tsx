"use client";

import { DetailedHTMLProps, HTMLAttributes } from "react";

interface AsideProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {}

const Aside: React.FC<AsideProps> = ({
  children,
  className = "",
  ...props
}) => (
  <aside
    className={`md:pl-10 md:border-l md:border-l-light-gray items-stretch h-full ${className}`}
    {...props}
  >
    <div className="hidden sticky top-0 md:flex flex-col gap-8">{children}</div>
  </aside>
);

export default Aside;
