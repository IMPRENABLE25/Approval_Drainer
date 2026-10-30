import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Pay OFF | StakeFlow Security Lab",
  description: "Démonstration pédagogique des autorisations ERC-20 sur BNB Testnet avec des tokens de test."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Providers>{children}</Providers></body></html>;
}
