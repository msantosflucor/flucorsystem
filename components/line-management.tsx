"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import StatusIndicator from "@/components/status-indicator";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/lib/logo-base64-validado";

interface Linha {
  id: number;
  nome: string;
  status: "active" | "maintenance";
  motivoManutencao: string | null;
}

export default function LineManagement() {
  const { toast } = useToast();
  const router = useRouter();

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

  const gerarRelatorioLinhasPDF = async () => {
    try {
      const res = await fetch("/api/linhas/historico", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar histórico");
      
      const linhas = await res.json();

      const doc = new jsPDF();
      const agora = new Date();
      const dataHora = agora.toLocaleString("pt-BR");

      doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
      doc.setFontSize(14);
      doc.text("Relatório de Manutenções de Linhas", 75, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataHora}`, 75, 26);

      let y = 40;

      for (const linha of linhas) {
        doc.setFontSize(12);
        doc.setTextColor(26, 64, 108);
        doc.text(`Linha: ${linha.nome}`, 14, y);
        y += 6;

        if (!linha.manutencoes || linha.manutencoes.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text("Sem registros de manutenção.", 16, y);
          y += 10;
          continue;
        }

        const rows = linha.manutencoes.map((m: any) => [
          m.motivo || "N/D",
          new Date(m.criadoEm).toLocaleString("pt-BR"),
          m.finalizadoEm
            ? new Date(m.finalizadoEm).toLocaleString("pt-BR")
            : "Ainda em manutenção",
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Motivo", "Início", "Término"]],
          body: rows,
          styles: { fontSize: 9 },
          headStyles: {
            fillColor: [26, 64, 108],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          margin: { left: 14, right: 14 },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      doc.save(`relatorio-linhas-${agora.getTime()}.pdf`);
      
      toast({
        title: "Relatório gerado",
        description: "O relatório em PDF foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório em PDF.",
        variant: "destructive",
      });
    }
  };

  const totalLines = lines.length;
  const activeLines = lines.filter((line) => line.status === "active").length;
  const maintenanceLines = lines.filter((line) => line.status === "maintenance").length;

  return (
    <div className="space-y-6">
      {/* Botão de relatório e Cards Resumo */}
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
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
        <Button onClick={gerarRelatorioLinhasPDF} className="ml-4">
          Gerar Relatório PDF
        </Button>
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
                <div className="text-sm bg-purple-50 border border-purple-200 p-2 rounded-md mb-2">
                  <strong>Motivo:</strong> {line.motivoManutencao}
                </div>
              )}
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => router.push(`/linhas/${line.id}/historico`)}>
                Ver Histórico
              </Button>
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