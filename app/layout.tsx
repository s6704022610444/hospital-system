import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { PrintStyles } from "@/src/components/layout/PrintStyles";

export const metadata: Metadata = {
  title: "โรงพยาบาลมหาราชนครราชสีมา - ระบบผู้ป่วยนอก (OPD System)",
  description: "ระบบบริหารจัดการผู้ป่วยนอก โรงพยาบาลมหาราชนครราชสีมา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <PrintStyles />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
