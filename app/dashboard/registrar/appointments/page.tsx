"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentsSubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/registrar?tab=appointments");
  }, [router]);
  return null;
}
