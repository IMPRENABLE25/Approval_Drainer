"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import type { Chain } from "viem";
import { ReactNode, useState } from "react";

export const bscTestnet = {
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "Test BNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://bsc-testnet-dataseed.bnbchain.org"] } }
} satisfies Chain;

const config = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http("https://bsc-testnet-dataseed.bnbchain.org")
  }
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>;
}
