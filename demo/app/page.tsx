import type { Metadata } from "next";
import { DecoderDemo } from "./DecoderDemo";

export const metadata: Metadata = {
  title: "AVAX Impact — Builder Attribution for Avalanche",
  description:
    "Decode ERC-8021 builder attribution from Avalanche transactions and calldata.",
};

export default function Home() {
  return <DecoderDemo />;
}
