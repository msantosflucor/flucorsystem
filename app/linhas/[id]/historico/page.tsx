"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FlucorLogo from "@/components/flucor-logo";
import UnitSelector from "@/components/unit-selector";
import { useToast } from "@/hooks/use-toast";

interface Manutencao {
  id: number;
  motivo: string;
  criadoEm: string;
  finalizadoEm: string | null;
}

function calcularDuracaoMinutos(inicio: string, fim: string | null): string {
  if (!fim) return "Em andamento";
  const start = new Date(inicio);
  const end = new Date(fim);
  const diffMs = end.getTime() - start.getTime();
  const minutos = Math.floor(diffMs / 60000);
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return `${horas}h ${minutosRestantes}min`;
}

export default function HistoricoManutencaoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [historico, setHistorico] = useState<Manutencao[]>([]);
  const [unitColor, setUnitColor] = useState("#8B1A1A");

  useEffect(() => {
    fetch(`/api/linhas/${id}/historico`)
      .then((res) => res.json())
      .then(setHistorico)
      .catch((err) => {
        console.error("Erro ao carregar histórico:", err);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de manutenções.",
          variant: "destructive",
        });
      });
  }, [id, toast]);

  const handleUnitChange = (color: string) => {
    setUnitColor(color);
    toast({
      title: "Unidade alterada",
      description: "Você alterou para uma nova unidade.",
    });
  };

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho com logo e unidade */}
      <header className="mb-6 flex items-center justify-between">
        <FlucorLogo size="medium" unitColor={unitColor} />
        <div className="flex items-center gap-2">
          <UnitSelector currentUnitColor={unitColor} onUnitChange={handleUnitChange} />
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            ← Voltar
          </Button>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Histórico de Manutenções</h1>

        {historico.length === 0 ? (
          <p className="text-muted-foreground text-center">
            Nenhuma manutenção registrada para esta linha.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {historico.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Início: {new Date(item.criadoEm).toLocaleString("pt-BR")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>Motivo:</strong> {item.motivo}</p>
                  <p>
                    <strong>Fim:</strong>{" "}
                    {item.finalizadoEm
                      ? new Date(item.finalizadoEm).toLocaleString("pt-BR")
                      : "Em andamento"}
                  </p>
                  <p><strong>Duração:</strong> {calcularDuracaoMinutos(item.criadoEm, item.finalizadoEm)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}