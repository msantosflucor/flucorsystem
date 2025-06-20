"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LaboratorioRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a aba de laboratório dentro do dashboard
    router.push("/dashboard?tab=laboratory");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-700">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <p className="text-sm">Carregando módulo laboratorial...</p>
    </div>
  );
}
