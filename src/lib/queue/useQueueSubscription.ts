"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/src/lib/supabase/client";

interface VisitQueueItem {
  id: string;
  vn: string;
  hn: string;
  status: string;
  chief_complaint?: string;
  created_at: string;
}

const fetcher = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visits")
    .select("id, vn, hn, status, chief_complaint, created_at")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as VisitQueueItem[];
};

export function useQueueSubscription(statusFilter?: string) {
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  const { data, error, mutate } = useSWR<VisitQueueItem[]>(
    "/api/queue/visits",
    fetcher,
    {
      refreshInterval: isRealtimeActive ? 0 : 15000,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("public:visits:queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        () => {
          mutate();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeActive(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setIsRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  const filteredQueue = (data || []).filter((item) =>
    statusFilter ? item.status === statusFilter : true
  );

  return {
    queue: filteredQueue,
    isLoading: !error && !data,
    isRealtimeActive,
    error,
    refreshQueue: mutate,
  };
}
