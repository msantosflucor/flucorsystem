"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import StatusIndicator from "@/components/status-indicator";

interface Linha {
  id: number;
  nome: string;
  status: "active" | "maintenance";
  motivoManutencao: string | null;
}

export default function LineManagement() {
  const { toast } = useToast();

  const [lines, setLines] = useState<Linha[]>([]);
  const [selectedLine, setSelectedLine] = useState<Linha | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inMaintenance, setInMaintenance] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch("/api/linhas")
      .then((res) => res.json())
      .then((data) => setLines(data))
      .catch((error) => {
        console.error("Erro ao carregar linhas:", error);
        toast({ title: "Erro", description: "Falha ao carregar linhas." });
      });
  }, []);

  const openLineDialog = (line: Linha) => {
    setSelectedLine(line);
    setInMaintenance(line.status === "maintenance");
    setReason(line.motivoManutencao || "");
    setDialogOpen(true);
  };

  const toggleMaintenanceStatus = async (lineId: number, inMaintenance: boolean, motivo = "") => {
    try {
      const res = await fetch("/api/linhas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lineId,
          status: inMaintenance ? "maintenance" : "active",
          motivoManutencao: inMaintenance ? motivo : "",
        }),
      });

      if (!res.ok) throw new Error("Falha na atualização");

      const updatedLine = await res.json();

      setLines((prev) =>
        prev.map((line) => (line.id === lineId ? updatedLine : line))
      );

      toast({
        title: inMaintenance ? "Linha em manutenção" : "Linha ativada",
        description: `${updatedLine.nome} foi ${inMaintenance ? "colocada em manutenção" : "reativada"}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = () => {
    if (inMaintenance && !reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, forneça um motivo para manutenção.",
        variant: "destructive",
      });
      return;
    }

    if (selectedLine) {
      toggleMaintenanceStatus(selectedLine.id, inMaintenance, reason);
      setDialogOpen(false);
    }
  };

  const totalLines = lines.length;
  const activeLines = lines.filter((line) => line.status === "active").length;
  const maintenanceLines = lines.filter((line) => line.status === "maintenance").length;

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total de Linhas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totalLines}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Linhas Ativas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{activeLines}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Em Manutenção</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{maintenanceLines}</CardContent>
        </Card>
      </div>

      {/* Cards de linhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lines.map((line) => (
          <Card key={line.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                {line.nome}
                <StatusIndicator status={line.status === "maintenance" ? "maintenance" : "approved"} size="small" />
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => openLineDialog(line)}>
                <Settings className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {line.status === "maintenance" && line.motivoManutencao && (
                <div className="text-sm bg-purple-50 border border-purple-200 p-2 rounded-md">
                  <strong>Motivo:</strong> {line.motivoManutencao}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar {selectedLine?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Modo de Manutenção</Label>
              <Switch checked={inMaintenance} onCheckedChange={setInMaintenance} />
            </div>
            {inMaintenance && (
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveChanges}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
