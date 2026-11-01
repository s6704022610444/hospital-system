"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterSubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/registrar?tab=new_patient");
  }, [router]);
  return null;
}
