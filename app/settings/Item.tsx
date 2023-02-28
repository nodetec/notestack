import { FC, ReactNode } from "react";

interface ItemProps {
  title: string;
  children: ReactNode;
  onClick: () => void;
}

const Item: FC<ItemProps> = ({ title, onClick, children }) => (
  <button
    className="w-full flex items-center gap-4 justify-between text-sm"
    onClick={onClick}
  >
    <h3>{title}</h3>
    <span className="text-gray max-w-[70%] overflow-hidden hover:text-gray-hover whitespace-nowrap text-ellipsis">
      {children}
    </span>
  </button>
);

export default Item;
