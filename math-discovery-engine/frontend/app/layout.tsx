/**
 * frontend/app/layout.tsx
 * Root layout — sets metadata, Google Fonts (Inter + JetBrains Mono),
 * and forces the Obsidian Slate dark background at the HTML level.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Visual Mathematical Discovery Engine",
  description:
    "Compute topological and geometric invariants for graphs, knots, and Boolean circuits. Visualise the latent mathematical structure to help discover new theorems.",
  keywords: ["mathematics", "topology", "graph theory", "knot theory", "invariants", "visualisation"],
  authors: [{ name: "Discovery Engine Team" }],
  openGraph: {
    title: "Visual Mathematical Discovery Engine",
    description: "Discover new theorems by visualising mathematical structure.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} style={{ height: "100%" }}>
      <body style={{ height: "100%", margin: 0, background: "#141617" }}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
