"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QueueSubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/registrar?tab=today_queue");
  }, [router]);
  return null;
}
