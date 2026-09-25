import type { Metadata } from "next";
import TermsConditions from "./components/TermsConditions";
import { STORE_NAME } from "@/lib/store-defaults";

export const metadata: Metadata = {
  title: `Syarat & Ketentuan | ${STORE_NAME}`,
  description: `Syarat dan ketentuan penggunaan layanan di ${STORE_NAME}.`,
};

export default function TermsConditionsPage() {
  return <TermsConditions />;
}