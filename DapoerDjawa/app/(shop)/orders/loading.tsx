import React from "react";

export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-2 w-full">
          <div className="h-6 md:h-8 w-40 md:w-52 bg-gray-200 rounded-lg" />
          <div className="h-3 md:h-4 w-3/4 max-w-[320px] bg-gray-200 rounded-md" />
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-100 shadow-sm">
        <div className="space-y-4 md:space-y-6">
          {[1, 2, 3].map((key) => (
            <OrderSkeleton key={key} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 md:gap-5">
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-2.5 md:h-3 w-16 md:w-20 bg-gray-200 rounded" />
            <div className="h-4 md:h-5 w-32 md:w-44 bg-gray-200 rounded" />
          </div>
          <div className="h-5 md:h-6 w-16 md:w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-3 md:gap-4 mt-4 md:mt-5 pt-3 md:pt-4 border-t border-gray-100">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 border-2 border-white" />
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 border-2 border-white" />
          </div>
          <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6">
        <div className="space-y-1 md:space-y-2">
          <div className="h-2.5 md:h-3 w-16 md:w-20 bg-gray-200 rounded md:ml-auto" />
          <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-200 rounded md:ml-auto" />
        </div>
        <div className="h-8 md:h-10 w-20 md:w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}