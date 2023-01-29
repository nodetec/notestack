import { DetailedHTMLProps, HTMLAttributes } from "react";

interface ContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const Content: React.FC<ContentProps> = ({ children }) => (
  <div className="w-full max-w-[45rem] mx-auto">{children}</div>
);

export default Content;
