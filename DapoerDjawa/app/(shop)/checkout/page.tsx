import { Suspense } from "react";
import CheckoutClient from "./components/CheckoutClient";
import Loading from "./loading";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata = {
  title: `Checkout | ${STORE_NAME}`,
  description: "Selesaikan pesanan dan pembayaran Anda.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutClient />
    </Suspense>
  );
}