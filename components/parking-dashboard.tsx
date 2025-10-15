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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/lib/logo-base64-validado";

interface ParkingDashboardProps {
  onAtualizarCaixas: () => Promise<void>;
}

const tipoLinhaPorCaixa: Record<number, string> = {
  1: "Diversos",
  2: "Diversos",
  3: "Oleoso",
  4: "Alcalino",
  5: "Ácidos",
  6: "Lodo",
};

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
  const [isCarregamento, setIsCarregamento] = useState(false);
  const [placaBusca, setPlacaBusca] = useState("");
  const [mostrarLegenda, setMostrarLegenda] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrucks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/caminhoes", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      // Filtro mais permissivo - mantém caminhões até a pós-análise
      const filtered = data.filter((item: any) => {
        return (
          !item.status.includes("finalizado") &&
          item.status !== "historico" &&
          item.caixaId === null
        );
      });

      const mappedData = filtered.map((item: any) => {
        const ultimaAnalise = item.analises?.[0] || null;
        return {
          id: item.id,
          plate: item.placa,
          motorista: item.motorista ?? "Não informado",
          transportadora: item.transportadora ?? "Não informado",
          origin: ultimaAnalise?.origem || item.origem || "Não informado",
          box: item.caixa?.nome ?? (item.destinoCaixa?.nome ? `Fila: ${item.destinoCaixa.nome}` : null),
          destinoCaixaId: item.destinoCaixaId,
          status: item.status,
          type: ultimaAnalise?.tipoResiduo || item.tipo || "Diversos",
          time: Math.floor((Date.now() - new Date(item.criadoEm).getTime()) / 60000),
          liberadaIncompativel: item.liberadaIncompativel,
          analises: item.analises || [],
          carregamento: item.carregamento || false,
          horaInicioCarregamento: item.horaInicioCarregamento || null,
          horaFimCarregamento: item.horaFimCarregamento || null,
          motivoLiberacao: item.motivoLiberacao || null,
          observacoes: ultimaAnalise?.observacoes || "",
          tanque: ultimaAnalise?.tanque || ""
        };
      });

      setTrucksData(mappedData);
    } catch (error) {
      console.error("Erro ao buscar caminhões:", error);
      toast({
        title: "Erro ao carregar caminhões",
        description: "Não foi possível atualizar a lista de caminhões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  const openDetailsDialog = async (truckId: number) => {
    const truck = trucksData.find((t) => t.id === truckId);
    if (!truck) return;
    setSelectedTruck(truck);
    setIsCarregamento(truck.carregamento === true);
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

      if (response.status === 403) {
        toast({
          title: "Encaminhamento bloqueado",
          description: result.error || "A linha da caixa está em manutenção.",
          variant: "destructive",
        });
        return;
      }

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
      await onAtualizarCaixas();
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
        body: JSON.stringify({ 
          motivo: motivoLiberacao,
          manterStatus: selectedTruck.status === "approved" || selectedTruck.status === "liberado_para_carregar"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao liberar caminhão");
      }

      toast({
        title: "Caminhão liberado",
        description: "Movido para histórico com o motivo registrado.",
      });

      setShowLiberarModal(false);
      setDetailsDialogOpen(false);
      setMotivoLiberacao("");
      fetchTrucks();
    } catch (error: any) {
      console.error("Erro ao liberar caminhão:", error);
      toast({
        title: "Erro ao liberar caminhão",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getMotivoBloqueio = (status: string) => {
    switch (status) {
      case "waiting": return "Caminhão aguardando análise.";
      case "in_progress": return "Caminhão em análise.";
      case "incompatible": return "Caminhão com amostra incompatível.";
      case "rejected": return "Caminhão recusado pelo laboratório.";
      default: return "Caminhão não liberado para encaminhamento.";
    }
  };

  const filteredTrucks = trucksData.filter((truck) => {
    const matchesStatus = statusFilter === "all" || truck.status === statusFilter;
    const matchesType = typeFilter === "all" || truck.type === typeFilter;
    const matchesPlaca = truck.plate.toUpperCase().includes(placaBusca.toUpperCase());
    return matchesStatus && matchesType && matchesPlaca;
  });

  const getTruckBackgroundColor = (truck: any) => {
    const { status, carregamento, horaFimCarregamento } = truck;
    
    // Caminhões de carregamento que já finalizaram (aguardando pós-análise)
    if (carregamento === true && horaFimCarregamento) {
      return "bg-purple-100 border-purple-300";
    }
    
    // Caminhões de carregamento normais
    if (carregamento === true) {
      return status === "rejected" ? "bg-gray-300 border-gray-400" : "bg-cyan-100 border-cyan-400";
    }
    
    // Caminhões normais (descarga)
    switch (status) {
      case "approved": 
      case "liberado_para_carregar": 
        return "bg-green-100 border-green-300";
      case "in_progress": return "bg-yellow-100 border-yellow-300";
      case "incompatible": return "bg-red-100 border-red-300";
      case "rejected": return "bg-gray-300 border-gray-400 text-black";
      case "waiting":
      default: return "bg-blue-100 border-blue-300";
    }
  };

  const getTruckStatusIcon = (truck: any) => {
    const { status, carregamento, horaFimCarregamento } = truck;
    
    // Caminhões de carregamento que já finalizaram (aguardando pós-análise)
    if (carregamento === true && horaFimCarregamento) {
      return <Clock className="h-5 w-5 text-purple-600" />;
    }
    
    switch (status) {
      case "approved":
      case "liberado_para_carregar": 
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress": return <Clock className="h-5 w-5 text-yellow-600" />;
      case "incompatible": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "rejected": return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      case "waiting":
      default: return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusText = (truck: any) => {
    const { status, carregamento, horaFimCarregamento } = truck;
    
    // Caminhões de carregamento que já finalizaram (aguardando pós-análise)
    if (carregamento === true && horaFimCarregamento) {
      return "Aguardando Pós-Análise";
    }
    
    switch (status) {
      case "approved": return "Liberado para Descarregar";
      case "liberado_para_carregar": return "Liberado para Carregar";
      case "in_progress": return "Em Análise";
      case "incompatible": return "Incompatível";
      case "rejected": return "Recusado pelo Laboratório";
      case "waiting": return "Aguardando";
      default: return status;
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR");
    const horaFormatada = agora.toLocaleTimeString("pt-BR");
    const timestamp = `${dataFormatada} ${horaFormatada}`;

    doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);

    doc.setFontSize(14);
    doc.text("Relatório de Caminhões no Pátio", 75, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${timestamp}`, 75, 26);

    doc.setFontSize(12);
    doc.text("Lista de caminhões ativos:", 14, 40);

    const rows = filteredTrucks.map((truck) => [
      truck.plate,
      truck.motorista,
      truck.transportadora,
      truck.origin,
      `${Math.floor(truck.time)} min`,
      getStatusText(truck),
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Placa", "Motorista", "Transportadora", "Origem", "Tempo de Espera", "Status"]],
      body: rows,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [26, 64, 108],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`relatorio-patio-${agora.getTime()}.pdf`);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />
              Estacionamento de Caminhões
            </h2>
            <p className="text-muted-foreground">Visualização dos caminhões no pátio</p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <Button variant="outline" className="h-[38px]" onClick={gerarPDF}>
              Gerar PDF
            </Button>
            <Button
              variant="ghost"
              className="h-[38px] px-2"
              onClick={() => setMostrarLegenda(true)}
              title="Ver legenda de cores"
            >
              <Info className="w-4 h-4" />
            </Button>
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
                <option value="approved">Liberado para Descarregar</option>
                <option value="liberado_para_carregar">Liberado para Carregar</option>
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
            <div className="w-[200px]">
              <label htmlFor="placa-filter" className="block text-sm font-medium mb-1">Buscar Placa</label>
              <input
                id="placa-filter"
                type="text"
                placeholder="DIGITE A PLACA"
                className="w-full border px-3 py-2 rounded-md uppercase"
                value={placaBusca}
                onChange={(e) => setPlacaBusca(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

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
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredTrucks.map((truck) => {
                  const isCarregamento = truck.carregamento === true;
                  const carregamentoFinalizado = isCarregamento && truck.horaFimCarregamento;
                  
                  return (
                    <div
                      key={truck.id}
                      className={`relative rounded-md border p-3 ${getTruckBackgroundColor(truck)}`}
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {isCarregamento && (
                          <span title="Caminhão de Carregamento" className="text-lg">
                            🚚📦
                          </span>
                        )}
                        {carregamentoFinalizado && (
                          <Badge variant="outline" className="text-xs bg-purple-200">
                            Pós-Análise
                          </Badge>
                        )}
                        {getTruckStatusIcon(truck)}
                      </div>
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
                          {carregamentoFinalizado && (
                            <Badge variant="secondary" className="w-fit text-xs bg-purple-100 text-purple-800">
                              Carregamento Finalizado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{Math.floor(truck.time)} min</span>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                <div>
                  <h3 className="font-medium text-lg">{selectedTruck.plate}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTruck.motorista}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {getTruckStatusIcon(selectedTruck)}
                  <span>{getStatusText(selectedTruck)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ID</div>
                  <div className="font-medium">{selectedTruck.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tipo de Resíduo</div>
                  <div className="font-medium">{selectedTruck.type || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tempo de Espera</div>
                  <div className="font-medium">{Math.floor(selectedTruck.time)} minutos</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Origem</div>
                  <div className="font-medium">{selectedTruck.origin || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Motorista</div>
                  <div className="font-medium">{selectedTruck.motorista}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Transportadora</div>
                  <div className="font-medium">{selectedTruck.transportadora}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tanque</div>
                  <div className="font-medium">{selectedTruck.tanque || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Observações</div>
                  <div className="font-medium">{selectedTruck.observacoes || "—"}</div>
                </div>
              </div>

              {isCarregamento && (
                <>
                  <div>
                    <div className="text-sm text-gray-500">Início Carregamento</div>
                    <div className="font-medium">
                      {selectedTruck.horaInicioCarregamento
                        ? new Date(selectedTruck.horaInicioCarregamento).toLocaleString()
                        : "Não iniciado"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fim Carregamento</div>
                    <div className="font-medium">
                      {selectedTruck.horaFimCarregamento
                        ? new Date(selectedTruck.horaFimCarregamento).toLocaleString()
                        : "Não finalizado"}
                    </div>
                  </div>
                </>
              )}

              {!isCarregamento && (
                <>
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
                        {caixasDisponiveis.map((caixa) => {
                          const tipoLinha = tipoLinhaPorCaixa[caixa.id] || "Tipo desconhecido";
                          const statusInfo = caixa.status !== "livre" ? "(ocupada - em fila)" : "";
                          return (
                            <option key={caixa.id} value={caixa.id}>
                              {caixa.nome} - {tipoLinha} {statusInfo}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {isCarregamento ? (
                <div className="flex justify-between pt-2">
                  <Button variant="destructive" onClick={() => setShowLiberarModal(true)}>
                    Liberar caminhão
                  </Button>
                  {!selectedTruck.horaInicioCarregamento ? (
                    selectedTruck.status === "approved" || selectedTruck.status === "liberado_para_carregar" ? (
                      <Button
                        onClick={async () => {
                          try {
                            await fetch(`/api/caminhoes/${selectedTruck.id}/iniciar-carregamento`, {
                              method: "PATCH",
                              credentials: "include",
                            });
                            toast({
                              title: "Carregamento iniciado",
                              description: "Horário registrado com sucesso.",
                            });
                            setDetailsDialogOpen(false);
                            fetchTrucks();
                            await onAtualizarCaixas();
                          } catch (error) {
                            toast({
                              title: "Erro ao iniciar carregamento",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Iniciar Carregamento
                      </Button>
                    ) : (
                      <div className={`text-sm ${selectedTruck.status === "rejected" ? "text-red-700 bg-red-100 border-red-300" : "text-yellow-700 bg-yellow-100 border-yellow-300"} rounded p-2`}>
                        {selectedTruck.status === "rejected" 
                          ? "Recusado pelo Laboratório" 
                          : "Aguardando liberação do laboratório"}
                      </div>
                    )
                  ) : !selectedTruck.horaFimCarregamento ? (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm("Confirmar finalização do carregamento?")) return;
                        try {
                          const response = await fetch(`/api/caminhoes/${selectedTruck.id}/finalizar-carregamento`, {
                            method: "PATCH",
                            credentials: "include",
                          });

                          if (!response.ok) {
                            throw new Error("Failed to finalize loading");
                          }

                          toast({
                            title: "Carregamento finalizado",
                            description: "Aguardando pós-análise no laboratório.",
                          });
                          
                          setDetailsDialogOpen(false);
                          await onAtualizarCaixas();
                          await fetchTrucks();
                        } catch (error) {
                          toast({
                            title: "Erro ao finalizar carregamento",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Finalizar Carregamento
                    </Button>
                  ) : (
                    <div className="text-sm text-purple-700 bg-purple-100 border border-purple-300 rounded p-2">
                      Carregamento finalizado - Aguardando pós-análise
                    </div>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      <Dialog open={mostrarLegenda} onOpenChange={setMostrarLegenda}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legenda de Cores</DialogTitle>
            <DialogDescription>Significado das cores no pátio de caminhões:</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm mt-4">
            <li><span className="inline-block w-4 h-4 bg-blue-200 border border-blue-400 mr-2"></span> Aguardando</li>
            <li><span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-400 mr-2"></span> Em Análise</li>
            <li><span className="inline-block w-4 h-4 bg-green-200 border border-green-400 mr-2"></span> Liberado</li>
            <li><span className="inline-block w-4 h-4 bg-red-200 border border-red-400 mr-2"></span> Incompatível</li>
            <li><span className="inline-block w-4 h-4 bg-gray-300 border border-gray-400 mr-2"></span> Recusado</li>
            <li><span className="inline-block w-4 h-4 bg-cyan-100 border border-cyan-400 mr-2"></span> Caminhão de Carregamento</li>
            <li><span className="inline-block w-4 h-4 bg-purple-100 border border-purple-300 mr-2"></span> Aguardando Pós-Análise</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}