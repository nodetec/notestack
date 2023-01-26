import { useRouter } from "next/navigation";
import { HTMLAttributes, ReactNode } from "react";
import { IoChevronBack } from "react-icons/io5";
import Button from "./Button";

interface PostsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title: string;
}

const Posts = ({ title, children, className, ...props }: PostsProps) => {
  const router = useRouter();
  return (
    <div
      className={`flex flex-col justify-center flex-1 gap-3 px-2 w-full max-w-[50rem] ${
        className ? className : ""
      }`}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <Button
          color="neutralLight"
          variant="ghost"
          icon={<IoChevronBack />}
          onClick={() => router.back()}
        />
        <h1 className="text-3xl flex-1">{title}</h1>
      </div>
      {children}
    </div>
  );
};

export default Posts;
