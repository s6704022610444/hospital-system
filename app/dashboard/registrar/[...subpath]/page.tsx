"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegistrarCatchAllPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/registrar?tab=search");
  }, [router]);

  return null;
}
