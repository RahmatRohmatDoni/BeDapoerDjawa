import type { Metadata } from "next";
import TermsConditions from "./components/TermsConditions";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | DapoerDjawa",
  description: "Syarat dan ketentuan penggunaan layanan di DapoerDjawa.",
};

export default function TermsConditionsPage() {
  return <TermsConditions />;
}