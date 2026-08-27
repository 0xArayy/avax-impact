import type { Metadata } from "next";
import { DecoderDemo } from "./DecoderDemo";

export const metadata: Metadata = {
  title: "AVAX Impact — Attribution Readiness Workbench",
  description:
    "Inspect declared attribution and preflight exact attributed calls on Avalanche Fuji, without a wallet or private keys.",
};

export default function Home() {
  return <DecoderDemo />;
}
