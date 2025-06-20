"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Inicio() {
  const router = useRouter();

  useEffect(() => {
    const verificarPermissoesERedirecionar = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!data.user) {
          router.push("/login");
          return;
        }

        const permissoes: string[] = data.user.permissoes || [];

        const rotaPorModulo: Record<string, string> = {
          DASHBOARD: "/dashboard",
          LABORATORIO: "/laboratorio",
          CAIXAS: "/caixas",
          LINHAS: "/linhas",
          HISTORICO: "/historico",
          ESTACIONAMENTO: "/estacionamento",
          USUARIOS: "/auth/usuarios",
        };

        const primeiraRotaValida = permissoes.find((p) => rotaPorModulo[p]);

        if (primeiraRotaValida) {
          router.push(rotaPorModulo[primeiraRotaValida]);
        } else {
          router.push("/acesso-negado");
        }
      } catch (error) {
        console.error("Erro ao redirecionar:", error);
        router.push("/login");
      }
    };

    verificarPermissoesERedirecionar();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-700">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <p className="text-sm">Verificando permissões e redirecionando...</p>
    </div>
  );
}
