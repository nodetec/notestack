import Skeleton from "./Skeleton";

const RecommendedEvents = () => {
  return (
    <li>
      <div className="flex items-center gap-3 py-3 mb-2">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="w-1/4 h-3" />
      </div>
      <Skeleton className="h-3 rounded-sm w-3/4" />
    </li>
  );
};
export default RecommendedEvents;
