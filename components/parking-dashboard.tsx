"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ParkingDashboard() {
  const { toast } = useToast();
  const [trucksData, setTrucksData] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<any[]>([]);
  const [caixaSelecionada, setCaixaSelecionada] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const response = await fetch("/api/caminhoes");
        const data = await response.json();
        const filteredToPatio = data.filter((item: any) =>
          item.caixaId === null && item.status !== "finalizado"
        );
        const mappedData = filteredToPatio.map((item: any) => ({
          id: item.id,
          plate: item.placa,
          origin: item.origem ?? "Não informado",
          box: item.caixa?.nome ?? null,
          status: item.status ?? "waiting",
          type: item.tipo ?? "Diversos",
          time: Math.floor((Date.now() - new Date(item.criadoEm).getTime()) / 60000),
        }));
        setTrucksData(mappedData);
      } catch (error) {
        console.error("Erro ao buscar caminhões:", error);
      }
    };
    fetchTrucks();
  }, []);

  const openDetailsDialog = async (truck: any) => {
    setSelectedTruck(truck);
    setCaixaSelecionada(null);
    setDetailsDialogOpen(true);

    try {
      const response = await fetch("/api/caixas");
      const data = await response.json();
      const livres = data.filter((c: any) => c.status === "livre");
      setCaixasDisponiveis(livres);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
    }
  };

  const encaminharParaCaixa = async () => {
    if (!selectedTruck || !caixaSelecionada) return;

    try {
      const response = await fetch(`/api/caminhoes/${selectedTruck.id}/encaminhar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
        title: "Caminhão encaminhado!",
        description: `Encaminhado para a caixa com sucesso.`,
      });

      setDetailsDialogOpen(false);
      setTrucksData(prev => prev.filter((t) => t.id !== selectedTruck.id));
    } catch (error) {
      console.error("Erro ao encaminhar:", error);
    }
  };

  const filteredTrucks = trucksData.filter((truck) => {
    const matchesStatus = statusFilter === "all" || truck.status === statusFilter;
    const matchesType = typeFilter === "all" || truck.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const getTruckBackgroundColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-gradient-to-br from-green-100 to-green-200 border-green-300";
      case "in_progress":
        return "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300";
      case "incompatible":
        return "bg-gradient-to-br from-red-100 to-red-200 border-red-300";
      case "rejected":
        return "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-900 text-white";
      case "waiting":
      default:
        return "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300";
    }
  };

  const getTruckStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "incompatible":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "rejected":
        return <AlertTriangle className="h-5 w-5 text-white" />;
      case "waiting":
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
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
    <div className="space-y-4">
      {/* Filtros e título */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Estacionamento de Caminhões
          </h2>
          <p className="text-muted-foreground">Visualização dos caminhões no pátio</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="waiting">Aguardando</SelectItem>
              <SelectItem value="in_progress">Em Análise</SelectItem>
              <SelectItem value="approved">Liberado</SelectItem>
              <SelectItem value="incompatible">Incompatível</SelectItem>
              <SelectItem value="rejected">Recusado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Diversos">Diversos</SelectItem>
              <SelectItem value="Oleoso">Oleoso</SelectItem>
              <SelectItem value="Alcalino">Alcalino</SelectItem>
              <SelectItem value="Ácidos">Ácidos</SelectItem>
              <SelectItem value="Lodo">Lodo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de caminhões */}
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
                    <Badge variant="outline" className="w-fit font-medium text-sm">
                      {truck.type}
                    </Badge>
                    {truck.box && <span className="text-xs font-medium">{truck.box}</span>}
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
                      onClick={() => openDetailsDialog(truck)}
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

      {/* Modal de Detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Caminhão</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o caminhão {selectedTruck?.plate}
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
                <div className="text-sm text-gray-500 mb-1">Caixa Disponível</div>
                <Select onValueChange={setCaixaSelecionada}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a caixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {caixasDisponiveis.map((caixa: any) => (
                      <SelectItem key={caixa.id} value={String(caixa.id)}>
                        {caixa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setDetailsDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={encaminharParaCaixa} disabled={!caixaSelecionada}>
                  Encaminhar para Caixa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}