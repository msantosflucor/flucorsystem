"use client";

import React, { useState } from "react";
import { Clock, Truck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Caixa = {
  id: number;
  nome: string;
  status: "livre" | "ocupada";
  linha: { id: number; nome: string } | null;
  tipoResiduo: string;
  criadoEm: string | Date;
  caminhaoId?: number | null;
  caminhaoPlaca?: string | null;
};

interface BoxesStatusProps {
  caixas: Caixa[];
}

export default function BoxesStatus({ caixas }: BoxesStatusProps) {
  const { toast } = useToast();
  const [atualizando, setAtualizando] = useState<number | null>(null);

  const liberarCaixa = async (caixaId: number) => {
    setAtualizando(caixaId);

    try {
      const res = await fetch(`/api/caixas/${caixaId}/liberar`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao liberar a caixa.");
      }

      // Primeiro toast: confirmação de liberação
      toast({
        title: "Caixa liberada",
        description: data.message,
      });

      if (data.proximo) {
        const confirmar = window.confirm(
          `Há um caminhão no pátio com destino a esta caixa: ${data.proximo.placa}. Deseja puxá-lo agora?`
        );

        const segundaResposta = await fetch(`/api/caixas/${caixaId}/liberar`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmar }),
        });

        const segundaData = await segundaResposta.json();

        if (!segundaResposta.ok) {
          throw new Error(segundaData.error || "Falha ao puxar caminhão.");
        }

        toast({
          title: confirmar ? "Caminhão puxado" : "Aguardando seleção manual",
          description: segundaData.message,
        });
      }

      // Recarrega tudo ao final
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao liberar",
        description: err.message || "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setAtualizando(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {caixas.map((caixa) => {
        const corBorda =
          caixa.status === "ocupada" ? "border-red-500" : "border-green-500";
        const corFundo =
          caixa.status === "ocupada" ? "bg-red-50" : "bg-green-50";

        return (
          <Card
            key={caixa.id}
            className={`border-2 ${corBorda} ${corFundo} transition`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                {caixa.nome}
                <Badge
                  variant={caixa.status === "livre" ? "outline" : "default"}
                  className={
                    caixa.status === "livre"
                      ? "border-green-500 text-green-700"
                      : "border-red-500 text-red-700"
                  }
                >
                  {caixa.status === "livre" ? "Livre" : "Ocupada"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {caixa.linha?.nome || "Sem linha vinculada"}
              </p>
              <p className="text-sm text-muted-foreground">
                Tipo: {caixa.tipoResiduo}
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 text-sm">
              {caixa.status === "ocupada" && caixa.caminhaoPlaca ? (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    🚚 Placa: <strong>{caixa.caminhaoPlaca}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Criado em:{" "}
                    {new Date(caixa.criadoEm).toLocaleString("pt-BR")}
                  </span>
                </div>
              )}

              {caixa.status === "ocupada" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => liberarCaixa(caixa.id)}
                  disabled={atualizando === caixa.id}
                >
                  {atualizando === caixa.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Liberando...</span>
                    </>
                  ) : (
                    "Liberar Caixa"
                  )}
                </Button>
              ) : (
                <Button variant="default" size="sm" disabled>
                  Livre
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}