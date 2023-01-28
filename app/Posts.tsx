import { HTMLAttributes, ReactNode } from "react";

interface PostsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const Posts = ({ title, children, className, ...props }: PostsProps) => {
  return (
    <div
      className={`flex flex-col justify-center gap-3 w-full justify-self-center ${
        className ? className : ""
      }`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Posts;
