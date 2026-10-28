import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Approval Drainer | Smart Contract Security Lab",
  description: "Laboratoire local pour comprendre les approbations ERC-20 et leur révocation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Providers>{children}</Providers></body></html>;
}
