import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Médecin GI",
  description: "Dashboard des Médecins GI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
