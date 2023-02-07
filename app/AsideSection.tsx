"use client";
import { DetailedHTMLProps, HTMLAttributes } from "react";

interface AsideSectionProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  title: string;
}

const AsideSection: React.FC<AsideSectionProps> = ({ title, children }) => (
  <div>
    <h2 className="text-base font-medium my-4">{title}</h2>
    {children}
  </div>
);

export default AsideSection;
