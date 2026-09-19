import { Suspense } from "react";
import CheckoutClient from "./components/CheckoutClient";
import Loading from "./loading";

export const metadata = {
  title: "Checkout | DapoerDjawa",
  description: "Selesaikan pesanan dan pembayaran Anda.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutClient />
    </Suspense>
  );
}