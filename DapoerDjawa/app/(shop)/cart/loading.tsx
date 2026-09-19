import React from "react";

export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-12 md:py-24 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-4 w-56 bg-gray-200 rounded-md animate-pulse mt-3" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded-2xl animate-pulse sm:w-40" />
      </div>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="h-32 w-full bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-32 w-full bg-gray-200 rounded-2xl animate-pulse" />
          <div className="hidden lg:block h-50 w-full bg-gray-200 rounded-2xl animate-pulse mt-2" />
        </div>
        <div className="w-full lg:w-1/3">
          <div className="h-72 w-full bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="block lg:hidden w-full mt-8">
        <div className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}