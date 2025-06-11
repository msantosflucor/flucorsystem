"use client";

import { useEffect, useState } from "react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock, FlaskConical, AlertTriangle, CheckCircle2,
} from "lucide-react";

export default function LaboratoryAnalysis() {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetalhes, setSelectedDetalhes] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [tanque, setTanque] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchCaminhoes = async () => {
    try {
      const res = await fetch("/api/caminhoes", {
        credentials: "include",
      });
      const data = await res.json();
      setCaminhoes(data);
    } catch (err) {
      console.error("Erro ao buscar caminhões:", err);
    }
  };

  useEffect(() => {
    fetchCaminhoes();
  }, []);

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const sample = caminhoes.find((c) => c.id === selectedId);

  const handleSelecionar = (id: number) => {
    setSelectedId(id);
    const selected = caminhoes.find(c => c.id === id);
    setStatus(selected?.status || "");
    setTanque("");
    setObservacoes("");
    setActiveTab("analysis");
  };

  const openDetalhesDialog = (caminhao: any) => {
    const ultimaAnalise = caminhao.analises?.[0] || null;
    setSelectedDetalhes({ ...caminhao, ultimaAnalise });
    setDetailsDialogOpen(true);
  };

  const coletarAmostra = async (id: number) => {
    const confirmar = window.confirm("Confirmar coleta?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/caminhoes/${id}/coletar`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao registrar coleta");
      await fetchCaminhoes();
    } catch (err) {
      console.error("Falha na coleta:", err);
      alert("Erro ao registrar hora da coleta.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedId || !status || !tanque) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if ((status === "incompatible" || status === "rejected") && !observacoes) {
      alert("Observações obrigatórias para incompatíveis ou recusados.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/analises", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caminhaoId: selectedId,
          status,
          tanque,
          observacoes,
        }),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      await fetchCaminhoes();
      setSelectedId(null);
      setStatus("");
      setTanque("");
      setObservacoes("");
      setActiveTab("pending");
    } catch (err) {
      console.error("Erro ao registrar análise:", err);
      alert("Erro ao registrar análise.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "waiting": return "Aguardando";
      case "in_progress": return "Em Análise";
      case "approved": return "Liberado";
      case "incompatible": return "Incompatível";
      case "rejected": return "Recusado";
      default: return "Indefinido";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-50 border-yellow-300 text-yellow-700";
      case "in_progress": return "bg-blue-50 border-blue-300 text-blue-700";
      case "approved": return "bg-green-50 border-green-300 text-green-700";
      case "incompatible": return "bg-red-50 border-red-300 text-red-700";
      case "rejected": return "bg-gray-100 border-gray-300 text-gray-700";
      default: return "bg-muted";
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending">Registros</TabsTrigger>
        <TabsTrigger value="analysis" disabled={!sample}>Registrar Análise</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caminhoes.filter(c => c.status !== "finalizado").map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Placa: {c.placa}</span>
                  <Badge className={statusColor(c.status)}>{statusLabel(c.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Transportadora:</strong> {c.transportadora}</div>
                <div>
                  <strong>Caixa:</strong> {c.caixa ? `${c.caixa.nome} - ${c.caixa.tipoResiduo}` : "N/A"}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{getTimeElapsed(c.criadoEm)} min</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => openDetalhesDialog(c)}>Detalhes</Button>
                {!c.horaColeta ? (
                  <Button variant="outline" onClick={() => coletarAmostra(c.id)}>Coletar</Button>
                ) : (
                  <Button onClick={() => handleSelecionar(c.id)}>Analisar</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="analysis">
        {sample ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Registrar Análise Laboratorial
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><strong>ID do Registro:</strong> {sample.id}</div>
                <div><strong>Placa:</strong> {sample.placa}</div>
                <div><strong>Transportadora:</strong> {sample.transportadora}</div>
                <div>
                  <strong>Caixa:</strong> {sample.caixa ? `${sample.caixa.nome} - ${sample.caixa.tipoResiduo}` : "N/A"}
                </div>
                <div><strong>Hora de entrada do caminhão:</strong> {new Date(sample.criadoEm).toLocaleString("pt-BR")}</div>
                {sample.horaColeta && (
                  <div><strong>Hora da coleta:</strong> {new Date(sample.horaColeta).toLocaleString("pt-BR")}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status da Análise</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button variant={status === "approved" ? "default" : "outline"} className={status === "approved" ? "bg-green-600 text-white" : ""} onClick={() => setStatus("approved")}>Liberado</Button>
                  <Button variant={status === "in_progress" ? "default" : "outline"} className={status === "in_progress" ? "bg-yellow-500 text-white" : ""} onClick={() => setStatus("in_progress")}>Em Análise</Button>
                  <Button variant={status === "incompatible" ? "default" : "outline"} className={status === "incompatible" ? "bg-red-600 text-white" : ""} onClick={() => setStatus("incompatible")}>Incompatível</Button>
                  <Button variant={status === "rejected" ? "default" : "outline"} className={status === "rejected" ? "bg-gray-800 text-white" : ""} onClick={() => setStatus("rejected")}>Recusado</Button>
                </div>
              </div>

              <div>
                <Label>Tanque de Destino</Label>
                <Input placeholder="TQ01, TQ02, etc." value={tanque} onChange={(e) => setTanque(e.target.value)} />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea placeholder="Instruções adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} />
              </div>

              {(status === "incompatible" || status === "rejected") && !observacoes && (
                <div className="flex items-start gap-2 p-4 border border-red-300 bg-red-50 rounded-md">
                  <AlertTriangle className="text-red-600 mt-1" />
                  <p className="text-sm text-red-800">Observações obrigatórias para esse status.</p>
                </div>
              )}

              {status === "approved" && (
                <div className="flex items-start gap-2 p-4 border border-green-300 bg-green-50 rounded-md">
                  <CheckCircle2 className="text-green-600 mt-1" />
                  <p className="text-sm text-green-800">
                    A amostra será liberada para o tanque <strong>{tanque || "[não informado]"}</strong>.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("pending")}>Voltar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Análise"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <p className="text-muted-foreground">Nenhuma amostra selecionada.</p>
        )}
      </TabsContent>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>

          {selectedDetalhes && (
            <div className="space-y-2 text-sm">
              <div><strong>Placa:</strong> {selectedDetalhes.placa}</div>
              <div><strong>Transportadora:</strong> {selectedDetalhes.transportadora}</div>
              <div>
                <strong>Caixa:</strong>{" "}
                {selectedDetalhes.caixa
                  ? `${selectedDetalhes.caixa.nome} - ${selectedDetalhes.caixa.tipoResiduo}`
                  : "N/A"}
              </div>
              <div><strong>Hora de entrada:</strong> {new Date(selectedDetalhes.criadoEm).toLocaleString("pt-BR")}</div>
              <div>
                <strong>Hora da coleta:</strong>{" "}
                {selectedDetalhes.horaColeta
                  ? new Date(selectedDetalhes.horaColeta).toLocaleString("pt-BR")
                  : "Aguardando coleta"}
              </div>
              <div><strong>Status:</strong> {statusLabel(selectedDetalhes.status)}</div>
              <div><strong>Tanque:</strong> {selectedDetalhes.ultimaAnalise?.tanque || "—"}</div>
              <div><strong>Observações:</strong> {selectedDetalhes.ultimaAnalise?.observacoes || "—"}</div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}