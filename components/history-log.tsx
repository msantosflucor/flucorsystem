"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Search, FileDown, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Analysis {
  liberadaIncompativel: boolean;
  justificativaLiberacaoIncompativel: string | null;
  dataAnalise: Date;
}

interface HistoryRecord {
  id: string;
  caminhaoId: number;
  plate: string;
  collectionDate: Date | null;
  horaSaida: Date | null;
  horaInicioCarregamento: Date | null;
  horaFimCarregamento: Date | null;
  tempoLiberacaoMin: number | null;
  destination: string;
  manual: boolean;
  observations: string;
  transportadora: string;
  entryDate: Date | null;
  status: string;
  motivoLiberacao: string | null;
  analises: Analysis[];
}

export default function HistoryLog() {
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isConcludingExit, setIsConcludingExit] = useState(false);

  useEffect(() => {
    fetchHistory();

    fetch("/api/auth/session", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUserRole(data?.user?.role ?? null);
      })
      .catch(err => console.error("Erro ao obter sessão:", err));
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/historico", { cache: "no-store" });
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const concluirSaida = async (caminhaoId: number) => {
    setIsConcludingExit(true);
    try {
      const res = await fetch(`/api/caminhoes/${caminhaoId}/concluir-saida`, {
        method: "PATCH",
      });

      const resultado = await res.json();

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Saída concluída com sucesso",
        });
        
        setSelectedRecord((prev) => ({
          ...prev!,
          horaSaida: resultado.horaSaida,
          tempoLiberacaoMin: resultado.tempoLiberacaoMin,
        }));

        setHistoryData((prevData) =>
          prevData.map((item) =>
            item.caminhaoId === caminhaoId
              ? {
                  ...item,
                  horaSaida: resultado.horaSaida,
                  tempoLiberacaoMin: resultado.tempoLiberacaoMin,
                }
              : item
          )
        );
      } else {
        console.error("Erro ao concluir saída", resultado);
        toast({
          title: "Erro",
          description: resultado.error || "Falha ao concluir saída",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao concluir saída",
        variant: "destructive",
      });
    } finally {
      setIsConcludingExit(false);
    }
  };

  const filteredData = historyData.filter((item) => {
    const matchesPlate = item.plate.toLowerCase().includes(searchPlate.toLowerCase());
    const matchesDestination =
      destinationFilter && destinationFilter !== "all"
        ? item.destination === destinationFilter
        : true;
    return matchesPlate && matchesDestination;
  });

  const openDetailsDialog = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const formatDateTime = (value: Date | string | null) => {
    if (!value) return "N/D";
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleString('pt-BR');
  };

  const hasLiberacaoIncompativel = (record: HistoryRecord) => {
    return record.analises?.some((analise) => 
      analise.liberadaIncompativel === true && 
      analise.justificativaLiberacaoIncompativel
    );
  };

  const getJustificativaLiberacao = (record: HistoryRecord) => {
    const analiseComJustificativa = record.analises?.find((a) => 
      a.liberadaIncompativel && a.justificativaLiberacaoIncompativel
    );
    return analiseComJustificativa?.justificativaLiberacaoIncompativel || "N/D";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Descarregamentos</CardTitle>
        <CardDescription>Visualize e filtre o histórico de descarregamentos</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Buscar por placa..."
                className="pl-9"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <FileDown className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Amostra</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Data/Hora Entrada</TableHead>
                  <TableHead>Tempo Liberação</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Autorização</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.plate}</TableCell>
                      <TableCell>{formatDateTime(item.entryDate)}</TableCell>
                      <TableCell>
                        {item.tempoLiberacaoMin != null
                          ? `${item.tempoLiberacaoMin} min`
                          : "N/D"}
                      </TableCell>
                      <TableCell>{item.destination}</TableCell>
                      <TableCell>
                        {item.horaInicioCarregamento ? (
                          <Badge variant="outline" className="border-blue-600 text-blue-700">
                            Carregamento
                          </Badge>
                        ) : item.manual ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-700">
                            Manual
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            Automática
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDetailsDialog(item)}
                          title="Ver detalhes"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {loading ? "Carregando registros..." : "Nenhum registro encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecord?.horaInicioCarregamento
                ? "Detalhes do Carregamento"
                : "Detalhes do Descarregamento"}
            </DialogTitle>
            <DialogDescription>
              Informações completas do caminhão e operação
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>ID:</strong> {selectedRecord.id}</div>
                <div><strong>Placa:</strong> {selectedRecord.plate}</div>
                <div><strong>Horário de chegada:</strong> {formatDateTime(selectedRecord.entryDate)}</div>

                {selectedRecord.horaInicioCarregamento ? (
                  <div><strong>Horário da liberação:</strong> {formatDateTime(selectedRecord.collectionDate)}</div>
                ) : (
                  <div><strong>Horário da coleta:</strong> {formatDateTime(selectedRecord.collectionDate)}</div>
                )}

                {selectedRecord.horaInicioCarregamento && (
                  <div><strong>Início do carregamento:</strong> {formatDateTime(selectedRecord.horaInicioCarregamento)}</div>
                )}
                {selectedRecord.horaFimCarregamento && (
                  <div><strong>Término do carregamento:</strong> {formatDateTime(selectedRecord.horaFimCarregamento)}</div>
                )}

                <div><strong>Horário de saída:</strong> {formatDateTime(selectedRecord.horaSaida)}</div>
                <div><strong>Tempo total:</strong> {selectedRecord.tempoLiberacaoMin != null ? `${selectedRecord.tempoLiberacaoMin} min` : "N/D"}</div>
                <div><strong>Destino:</strong> {selectedRecord.destination}</div>
                <div><strong>Transportadora:</strong> {selectedRecord.transportadora}</div>
              </div>

              <div>
                <strong>Observações:</strong> 
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  {selectedRecord.observations || "—"}
                </div>
              </div>

              {(userRole === "SYSADMIN" || userRole === "QUIMICO") &&
               hasLiberacaoIncompativel(selectedRecord) && (
                <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
                  <div className="text-sm font-medium text-blue-800">
                    Motivo da liberação por incompatibilidade:
                  </div>
                  <div className="mt-1 text-sm text-blue-900">
                    {getJustificativaLiberacao(selectedRecord)}
                  </div>
                </div>
              )}

              {selectedRecord.motivoLiberacao && (
                <div className="border rounded-md p-3 bg-red-50 border-red-200">
                  <div className="text-sm font-medium text-red-800">
                    Motivo da liberação sem descarregamento:
                  </div>
                  <div className="mt-1 text-sm text-red-900">
                    {selectedRecord.motivoLiberacao}
                  </div>
                </div>
              )}

              {selectedRecord?.status === "finalizado" && !selectedRecord.horaSaida && (
                <div className="pt-4">
                  <Button 
                    onClick={() => concluirSaida(selectedRecord.caminhaoId)} 
                    className="w-full md:w-auto"
                    disabled={isConcludingExit}
                  >
                    {isConcludingExit ? "Processando..." : "Concluir saída"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}