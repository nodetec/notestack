import { DetailedHTMLProps, HTMLAttributes } from "react";

interface ContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const Content: React.FC<ContentProps> = ({ className = "", children }) => (
  <div className={`w-full max-w-[22rem] sm:max-w-[32rem] md:max-w-[45rem] mx-auto ${className}`}>{children}</div>
);

export default Content;
