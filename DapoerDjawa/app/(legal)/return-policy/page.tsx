import type { Metadata } from "next";
import ReturnPolicy from "./components/ReturnPolicy";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Kebijakan Pengembalian | ${STORE_NAME}`,
  description: `Syarat dan prosedur pengembalian barang atau dana di ${STORE_NAME}.`,
};

export default function ReturnPolicyPage() {
  return <ReturnPolicy />;
}