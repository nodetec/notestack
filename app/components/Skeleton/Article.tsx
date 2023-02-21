import Skeleton from "./Skeleton";

const Article = () => {
  return (
    <div className="py-8 border-b border-b-light-gray overflow-x-hidden">
      <div className="flex gap-4 w-full items-center mb-8">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-1/4 rounded-sm" />
      </div>
      <div className="flex gap-8 item-start">
        <div className="flex gap-4 flex-col w-full">
          <Skeleton className="h-3 rounded-sm" />
          <Skeleton className="h-3 rounded-sm" />
          <Skeleton className="h-3 rounded-sm" />
          <Skeleton className="h-3 w-1/2 rounded-sm" />
        </div>
        <Skeleton className="h-16 sm:h-32 w-32 sm:w-64 rounded-md" />
      </div>
    </div>
  );
};
export default Article;
