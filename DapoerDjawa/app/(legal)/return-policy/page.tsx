import type { Metadata } from "next";
import ReturnPolicy from "./components/ReturnPolicy";

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian | DapoerDjawa",
  description: "Syarat dan prosedur pengembalian barang atau dana di DapoerDjawa.",
};

export default function ReturnPolicyPage() {
  return <ReturnPolicy />;
}