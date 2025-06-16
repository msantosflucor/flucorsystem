"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [historico, setHistorico] = useState<Manutencao[]>([]);

  useEffect(() => {
    fetch(`/api/linhas/${id}/historico`)
      .then((res) => res.json())
      .then(setHistorico)
      .catch((err) => console.error("Erro ao carregar histórico:", err));
  }, [id]);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Cabeçalho com botão voltar */}
      <div className="w-full max-w-4xl flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Voltar
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Histórico de Manutenções</h1>

        {historico.length === 0 ? (
          <p className="text-muted-foreground text-center">Nenhuma manutenção registrada para esta linha.</p>
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