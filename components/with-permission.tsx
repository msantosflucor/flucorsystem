"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function withPermission<P>(
  Component: React.ComponentType<P>,
  modulo: string
) {
  return function WrapperComponent(props: P) {
    const router = useRouter();
    const [temPermissao, setTemPermissao] = useState<boolean | null>(null);

    useEffect(() => {
      const permissoes =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("permissoes") || "[]")
          : [];

      if (permissoes.includes(modulo)) {
        setTemPermissao(true);
      } else {
        setTemPermissao(false);
        router.push("/acesso-negado");
      }
    }, [router]);

    if (temPermissao === null) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-gray-700">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <p className="text-sm">Verificando permissões...</p>
        </div>
      );
    }

    return temPermissao ? <Component {...props} /> : null;
  };
}