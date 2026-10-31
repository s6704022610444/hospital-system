import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/src/components/layout/Header";
import { SimulatorDrawer } from "@/src/components/simulator/SimulatorDrawer";

export const metadata: Metadata = {
  title: "Hospital OPD System",
  description: "Single Patient View Outpatient Department System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <SimulatorDrawer />
      </body>
    </html>
  );
}
