"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    async function join() {
      const { data, error } = await supabase
        .from("couples")
        .select("id")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/");
        return;
      }

      localStorage.setItem("couple_id", id);
      localStorage.setItem("couple_role", "p2");
      await supabase.from("couples").update({ p2_joined: true }).eq("id", id);
      router.replace(`/couple/${id}`);
    }

    join();
  }, [id, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">💕</div>
        <p className="text-gray-500">Joining your dinner space…</p>
      </div>
    </div>
  );
}
