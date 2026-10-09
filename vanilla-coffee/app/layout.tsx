import type { Metadata } from "next";
import { Playfair_Display, Poppins, Caveat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Vanilla Coffee",
  description:
    "Doces, café e momentos que combinam. Donuts artesanais, fatias de bolo generosas e cappuccino gelado feitos com carinho.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${poppins.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
