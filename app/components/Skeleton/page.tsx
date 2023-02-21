import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

interface SkeletonProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  delay?: number;
}

const Skeleton: FC<SkeletonProps> = ({ children, className, delay = 0 }) => {
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
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

export default Skeleton;
