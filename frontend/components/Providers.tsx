"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import type { Chain } from "viem";
import { ReactNode, useState } from "react";

export const localChain = {
  id: 31337,
  name: "Anvil local (31337)",
  nativeCurrency: { name: "Ether de test", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } }
} satisfies Chain;

export const bscTestnet = {
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "Test BNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://bsc-testnet-dataseed.bnbchain.org"] } }
} satisfies Chain;

const config = createConfig({
  chains: [localChain, bscTestnet],
  transports: {
    [localChain.id]: http("http://127.0.0.1:8545"),
    [bscTestnet.id]: http("https://bsc-testnet-dataseed.bnbchain.org")
  }
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>;
}
