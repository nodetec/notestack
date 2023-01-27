import { ReactNode } from "react";

interface ButtonsProps {
  children: ReactNode;
}

const Buttons = ({ children, ...props }: ButtonsProps) => (
  <div className="flex flex-col sm:flex-row gap-4" {...props}>
    {children}
  </div>
);

export default Buttons;
