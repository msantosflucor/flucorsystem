"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Clock, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ParkingDashboardProps {
  onAtualizarCaixas: () => Promise<void>;
}

export default function ParkingDashboard({ onAtualizarCaixas }: ParkingDashboardProps) {
  const { toast } = useToast();
  const [trucksData, setTrucksData] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<any[]>([]);
  const [caixaSelecionada, setCaixaSelecionada] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [motivoLiberacao, setMotivoLiberacao] = useState("");

  const fetchTrucks = async () => {
    try {
      const response = await fetch("/api/caminhoes");
      const data = await response.json();
      const filtered = data.filter((item: any) =>
        item.status !== "finalizado" && item.caixaId === null
      );
      const mappedData = filtered.map((item: any) => ({
        id: item.id,
        plate: item.placa,
        origin: item.origem ?? "Não informado",
        box: item.caixa?.nome ?? (item.destinoCaixa?.nome ? `Fila: ${item.destinoCaixa.nome}` : null),
        destinoCaixaId: item.destinoCaixaId,
        status: item.status ?? "waiting",
        type: item.tipo ?? "Diversos",
        time: Math.floor((Date.now() - new Date(item.criadoEm).getTime()) / 60000),
        liberadaIncompativel: item.liberadaIncompativel,
      }));
      setTrucksData(mappedData);
    } catch (error) {
      console.error("Erro ao buscar caminhões:", error);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const openDetailsDialog = async (truckId: number) => {
    const truck = trucksData.find((t) => t.id === truckId);
    if (!truck) return;
    setSelectedTruck(truck);
    setCaixaSelecionada(truck.destinoCaixaId ? String(truck.destinoCaixaId) : null);
    setDetailsDialogOpen(true);
    try {
      const response = await fetch("/api/caixas");
      const data = await response.json();

      const caixasLimpas = data.map((caixa: any) => ({
        id: caixa.id,
        nome: typeof caixa.nome === "string" ? caixa.nome : JSON.stringify(caixa.nome),
        status: typeof caixa.status === "string" ? caixa.status : JSON.stringify(caixa.status),
      }));

      console.log("CAIXAS FORMATADAS", caixasLimpas);
      setCaixasDisponiveis(caixasLimpas);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
    }
  };

  const encaminharParaCaixa = async () => {
    if (!selectedTruck || !caixaSelecionada) return;
    try {
      const response = await fetch(`/api/caminhoes/${selectedTruck.id}/mover-para-caixa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ caixaId: Number(caixaSelecionada) }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({
          title: "Erro ao encaminhar",
          description: result.error || "Falha desconhecida.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Caminhão na fila!",
        description: "Caminhão aguardando vaga na caixa selecionada.",
      });
      setDetailsDialogOpen(false);
      fetchTrucks();
      await onAtualizarCaixas(); // 🔁 Atualiza as caixas no Dashboard
    } catch (error) {
      console.error("Erro ao mover caminhão:", error);
    }
  };

  const liberarCaminhao = async () => {
    if (!selectedTruck || motivoLiberacao.trim() === "") {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da liberação.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/caminhoes/${selectedTruck.id}/liberar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ motivo: motivoLiberacao }),
      });

      if (!response.ok) {
        toast({
          title: "Erro ao liberar caminhão",
          description: "Não foi possível concluir a operação.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Caminhão liberado",
        description: "Movido para histórico com o motivo registrado.",
      });

      setShowLiberarModal(false);
      setDetailsDialogOpen(false);
      setMotivoLiberacao("");
      fetchTrucks();
    } catch (error) {
      console.error("Erro ao liberar caminhão:", error);
    }
  };

  const getMotivoBloqueio = (status: string) => {
    switch (status) {
      case "waiting": return "Caminhão aguardando análise.";
      case "in_progress": return "Caminhão em análise.";
      case "incompatible": return "Caminhão com amostra incompatível.";
      case "rejected": return "Caminhão recusado.";
      default: return "Caminhão não liberado para encaminhamento.";
    }
  };

  const filteredTrucks = trucksData.filter((truck) => {
    const matchesStatus = statusFilter === "all" || truck.status === statusFilter;
    const matchesType = typeFilter === "all" || truck.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const getTruckBackgroundColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 border-green-300";
      case "in_progress": return "bg-yellow-100 border-yellow-300";
      case "incompatible": return "bg-red-100 border-red-300";
      case "rejected": return "bg-gray-800 border-gray-900 text-white";
      case "waiting":
      default: return "bg-blue-100 border-blue-300";
    }
  };

  const getTruckStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress": return <Clock className="h-5 w-5 text-yellow-600" />;
      case "incompatible": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "rejected": return <AlertTriangle className="h-5 w-5 text-white" />;
      case "waiting":
      default: return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Liberado";
      case "in_progress": return "Em Análise";
      case "incompatible": return "Incompatível";
      case "rejected": return "Recusado";
      case "waiting": return "Aguardando";
      default: return "Desconhecido";
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filtros superiores */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />
              Estacionamento de Caminhões
            </h2>
            <p className="text-muted-foreground">Visualização dos caminhões no pátio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-[160px]">
              <label htmlFor="status-filter" className="block text-sm font-medium mb-1">Status</label>
              <select
                id="status-filter"
                className="w-full border px-3 py-2 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status</option>
                <option value="waiting">Aguardando</option>
                <option value="in_progress">Em Análise</option>
                <option value="approved">Liberado</option>
                <option value="incompatible">Incompatível</option>
                <option value="rejected">Recusado</option>
              </select>
            </div>

            <div className="w-[160px]">
              <label htmlFor="type-filter" className="block text-sm font-medium mb-1">Tipo</label>
              <select
                id="type-filter"
                className="w-full border px-3 py-2 rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Todos os tipos</option>
                <option value="Diversos">Diversos</option>
                <option value="Oleoso">Oleoso</option>
                <option value="Alcalino">Alcalino</option>
                <option value="Ácidos">Ácidos</option>
                <option value="Lodo">Lodo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de caminhões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pátio de Caminhões</span>
              <Badge variant="outline" className="font-normal">
                {filteredTrucks.length} caminhões
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredTrucks.map((truck) => (
                <div
                  key={truck.id}
                  className={`relative rounded-md border p-3 ${getTruckBackgroundColor(truck.status)}`}
                >
                  <div className="absolute top-2 right-2">{getTruckStatusIcon(truck.status)}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      <span className="font-bold">{truck.plate}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {truck.type && truck.type !== "Diversos" && (
                        <Badge variant="outline" className="w-fit font-medium text-sm">
                          {truck.type}
                        </Badge>
                      )}
                      {truck.box && (
                        <span className="text-xs font-medium">{truck.box}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{truck.time} min</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => openDetailsDialog(truck.id)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Caminhão</DialogTitle>
            <DialogDescription>
              {selectedTruck ? `Informações detalhadas sobre o caminhão ${selectedTruck.plate}` : "Carregando..."}
            </DialogDescription>
          </DialogHeader>

          {selectedTruck && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">{selectedTruck.plate}</h3>
                <div className="flex gap-2 items-center">
                  {getTruckStatusIcon(selectedTruck.status)}
                  <span>{getStatusText(selectedTruck.status)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ID</div>
                  <div className="font-medium">{selectedTruck.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tipo de Resíduo</div>
                  <div className="font-medium">{selectedTruck.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tempo de Espera</div>
                  <div className="font-medium">{selectedTruck.time} minutos</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Origem</div>
                  <div className="font-medium">{selectedTruck.origin}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Caixa direcionada</div>
                {selectedTruck.destinoCaixaId ? (
                  <div className="text-sm font-medium mb-2">
                    Direcionado para a caixa ID {selectedTruck.destinoCaixaId}
                  </div>
                ) : (
                  <div className="text-sm italic text-muted-foreground mb-2">
                    Sem caixa direcionada
                  </div>
                )}

                <div className="w-full">
                  <label htmlFor="caixa" className="block text-sm font-medium mb-1">
                    Selecionar Caixa
                  </label>
                  <select
                    id="caixa"
                    className="w-full border px-3 py-2 rounded-md"
                    value={caixaSelecionada ?? ""}
                    onChange={(e) => {
                      const novaCaixaId = e.target.value;
                      if (novaCaixaId === (caixaSelecionada ?? "")) return;
                      
                      if (selectedTruck?.destinoCaixaId && novaCaixaId !== String(selectedTruck.destinoCaixaId)) {
                        const confirmar = window.confirm("Certeza que deseja mudar a caixa direcionada?");
                        if (!confirmar) return;
                      }
                      
                      setCaixaSelecionada(novaCaixaId);
                    }}
                  >
                    <option value="">Selecione a caixa</option>
                    {caixasDisponiveis.map((caixa) => (
                      <option 
                        key={caixa.id} 
                        value={caixa.id}
                      >
                        {caixa.nome} {caixa.status !== "livre" && "(ocupada - em fila)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="destructive" onClick={() => setShowLiberarModal(true)}>
                  Liberar caminhão
                </Button>
                <Button
                  onClick={() => {
                    if (selectedTruck.status !== "approved") {
                      toast({
                        title: "Encaminhamento bloqueado",
                        description: getMotivoBloqueio(selectedTruck.status),
                        variant: "destructive",
                      });
                      return;
                    }
                    encaminharParaCaixa();
                  }}
                  disabled={!caixaSelecionada}
                >
                  Encaminhar para Caixa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de liberação */}
      <Dialog open={showLiberarModal} onOpenChange={setShowLiberarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar caminhão sem descarregar</DialogTitle>
            <DialogDescription>Informe o motivo:</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da liberação..."
              value={motivoLiberacao}
              onChange={(e) => setMotivoLiberacao(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button variant="secondary" onClick={() => setShowLiberarModal(false)}>Cancelar</Button>
            <Button onClick={liberarCaminhao}>Confirmar liberação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}