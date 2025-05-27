"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Caixa = {
  id: number;
  nome: string;
  status: "livre" | "ocupada";
  linha: { id: number; nome: string } | null;
  tipoResiduo: string;
  criadoEm: string | Date;
  caminhaoId?: number | null; // 🔥 Para saber qual caminhão está na caixa
};

export default function BoxesStatus() {
  const { toast } = useToast();
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [atualizando, setAtualizando] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCaixas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/caixas");
      const data = await res.json();
      setCaixas(data);
    } catch (err) {
      console.error("Erro ao buscar caixas:", err);
      toast({
        title: "Erro ao buscar caixas",
        description: "Não foi possível carregar os dados das caixas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaixas();
  }, []);

  const liberarCaixa = async (caixaId: number, caminhaoId: number | null) => {
    if (!caminhaoId) {
      toast({
        title: "Erro",
        description: "Nenhum caminhão encontrado nesta caixa.",
        variant: "destructive",
      });
      return;
    }

    setAtualizando(caixaId);
    try {
      const res = await fetch("/api/caixas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caixaId, caminhaoId }),
      });

      if (!res.ok) {
        throw new Error("Erro ao liberar a caixa.");
      }

      toast({
        title: "Caixa liberada",
        description: "A caixa foi liberada e o caminhão foi finalizado.",
      });

      fetchCaixas();
    } catch (err) {
      console.error("Erro ao liberar caixa:", err);
      toast({
        title: "Erro",
        description: "Não foi possível liberar a caixa.",
        variant: "destructive",
      });
    } finally {
      setAtualizando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (caixas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm col-span-3 text-center">
        Nenhuma caixa cadastrada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {caixas.map((caixa) => {
        const corBorda =
          caixa.status === "ocupada"
            ? "border-red-500"
            : caixa.status === "livre"
            ? "border-green-500"
            : "border-gray-300";

        const corFundo =
          caixa.status === "ocupada"
            ? "bg-red-50"
            : caixa.status === "livre"
            ? "bg-green-50"
            : "bg-gray-50";

        const dataCriacao = caixa.criadoEm
          ? new Date(caixa.criadoEm).toLocaleString("pt-BR")
          : "Data não disponível";

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
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>
                  Status: <strong>{caixa.status}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Criado em: {dataCriacao}</span>
              </div>
              {caixa.status === "ocupada" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => liberarCaixa(caixa.id, caixa.caminhaoId || null)}
                  disabled={atualizando === caixa.id}
                >
                  {atualizando === caixa.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Liberar Caixa"
                  )}
                </Button>
              )}
              {caixa.status === "livre" && (
                <Button
                  variant="default"
                  size="sm"
                  disabled
                >
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