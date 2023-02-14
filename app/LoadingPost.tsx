"use client";
import { FC } from "react";
import { FaBlog } from "react-icons/fa";

const LoadingPost: FC = () => (
  <div className="border-none shadow rounded-md p-4 mt-16 max-w-2xl w-full mx-auto">
    <div className="animate-pulse flex space-x-4">
      <FaBlog size="25" />
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-slate-700 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-700 rounded col-span-2"></div>
            <div className="h-2 bg-slate-700 rounded col-span-2"></div>
          </div>
          <div className="h-2 bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingPost;
