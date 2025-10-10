"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirecionaHistorico() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tab=history");
  }, [router]);

  return <div className="p-6">Redirecionando para histórico...</div>;
}