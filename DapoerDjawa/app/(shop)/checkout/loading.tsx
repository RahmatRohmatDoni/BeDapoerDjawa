import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
        Menyiapkan Checkout...
      </h2>
      <p className="text-sm md:text-base text-gray-500 mt-2">
        Mohon tunggu sebentar, kami sedang memuat data pesananmu.
      </p>
    </div>
  );
}