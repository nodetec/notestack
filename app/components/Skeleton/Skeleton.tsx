import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

interface SkeletonProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const Skeleton: FC<SkeletonProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`
      bg-light-gray
      bg-opacity-60
      relative
      before:absolute before:inset-0
      before:-translate-x-full
      before:animate-[shimmer_2s_infinite]
      before:bg-gradient-to-r
      before:from-transparent before:via-white before:to-transparent
      isolate
      overflow-hidden
      before:border-t before:border-white
      ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Skeleton;
