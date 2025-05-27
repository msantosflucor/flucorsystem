"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Truck, AlertTriangle, Info } from "lucide-react";
import StatusIndicator from "@/components/status-indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export default function PendingSamplesList() {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/caminhoes");
        const data = await res.json();
        setCaminhoes(data);
      } catch (error) {
        console.error("Erro ao buscar caminhões:", error);
      }
    };

    fetchData();
  }, []);

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const amostrasAtivas = caminhoes
    .filter((c) => c.status === "waiting" || c.status === "in_progress")
    .map((c) => ({
      ...c,
      elapsedTime: getTimeElapsed(c.criadoEm),
    }))
    .sort((a, b) => b.elapsedTime - a.elapsedTime);

  const handleOpenDetails = (sample: any) => {
    setSelectedSample(sample);
    setDetailsDialogOpen(true);
  };

  if (amostrasAtivas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amostras Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">
            Não há amostras ativas no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Amostras Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {amostrasAtivas.map((sample) => (
              <div
                key={sample.id}
                className={`p-3 rounded-md border ${
                  sample.elapsedTime > 30
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{sample.placa}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Truck className="h-3.5 w-3.5" />
                      <span>Caixa: {sample.caixa?.nome || "N/A"}</span>
                    </div>
                  </div>
                  <StatusIndicator status={sample.status} size="small" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm">
                    {sample.origem ? `Origem: ${sample.origem}` : "Origem: N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        sample.elapsedTime > 30
                          ? "text-red-600 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {sample.elapsedTime > 30 && (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      <Clock className="h-3.5 w-3.5" />
                      <span>{sample.elapsedTime} min</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDetails(sample)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>

          {selectedSample && (
            <div className="space-y-4">
              <div>
                <strong>ID:</strong> {selectedSample.id}
              </div>
              <div>
                <strong>Placa:</strong> {selectedSample.placa}
              </div>
              <div>
                <strong>Origem:</strong> {selectedSample.origem || "N/A"}
              </div>
              <div>
                <strong>Caixa:</strong> {selectedSample.caixa?.nome || "N/A"}
              </div>
              <div>
                <strong>Data de Cadastro:</strong>{" "}
                {new Date(selectedSample.criadoEm).toLocaleString("pt-BR")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Tempo de Espera:</strong>{" "}
                  {getTimeElapsed(selectedSample.criadoEm)} minutos
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}