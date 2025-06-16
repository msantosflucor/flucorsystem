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

export default function HistoryLog() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/historico", { cache: "no-store" });
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  const concluirSaida = async (caminhaoId: number) => {
    try {
      const res = await fetch(`/api/caminhoes/${caminhaoId}/concluir-saida`, {
        method: "PATCH",
      });

      const resultado = await res.json();

      if (res.ok) {
        setSelectedRecord((prev) => ({
          ...prev,
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
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    }
  };

  const filteredData = historyData
    .filter((item) => item.status === "finalizado")
    .filter((item) => {
      const matchesPlate = item.plate.toLowerCase().includes(searchPlate.toLowerCase());
      const matchesDestination =
        destinationFilter && destinationFilter !== "all"
          ? item.destination === destinationFilter
          : true;
      return matchesPlate && matchesDestination;
    });

  const openDetailsDialog = (record) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const formatDateTime = (value) => {
    return value ? new Date(value).toLocaleString() : "N/D";
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
                  <TableHead>Data/Hora Coleta</TableHead>
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
                      <TableCell>{formatDateTime(item.collectionDate)}</TableCell>
                      <TableCell>
                        {item.tempoLiberacaoMin != null
                          ? `${item.tempoLiberacaoMin} min`
                          : "N/D"}
                      </TableCell>
                      <TableCell>{item.destination}</TableCell>
                      <TableCell>
                        {item.manual ? (
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
                        <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(item)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Descarregamento</DialogTitle>
            <DialogDescription>
              Informações completas do caminhão e operação
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-2">
              <div>
                <strong>ID:</strong> {selectedRecord.id}
              </div>
              <div>
                <strong>Placa:</strong> {selectedRecord.plate}
              </div>
              <div>
                <strong>Horário de chegada:</strong>{" "}
                {formatDateTime(selectedRecord.entryDate)}
              </div>
              <div>
                <strong>Horário da coleta:</strong>{" "}
                {formatDateTime(selectedRecord.collectionDate)}
              </div>
              <div>
                <strong>Horário de saída:</strong>{" "}
                {formatDateTime(selectedRecord.horaSaida)}
              </div>
              <div>
                <strong>Tempo total (entrada até saída):</strong>{" "}
                {selectedRecord.tempoLiberacaoMin != null
                  ? `${selectedRecord.tempoLiberacaoMin} min`
                  : "N/D"}
              </div>
              <div>
                <strong>Destino:</strong> {selectedRecord.destination || "N/D"}
              </div>
              <div>
                <strong>Transportadora:</strong> {selectedRecord.transportadora}
              </div>
              <div>
                <strong>Observações:</strong>{" "}
                {selectedRecord.observations || "—"}
              </div>

              {selectedRecord.motivoLiberacao && (
                <div className="border rounded-md p-2 bg-red-50 border-red-300 mt-2">
                  <div className="text-sm text-red-800 font-semibold">
                    Motivo da liberação sem descarregamento:
                  </div>
                  <div className="text-sm text-red-900 mt-1 italic">
                    {selectedRecord.motivoLiberacao}
                  </div>
                </div>
              )}

              {!selectedRecord.horaSaida && (
                <Button
                  onClick={() => concluirSaida(selectedRecord.caminhaoId)}
                  className="mt-4"
                >
                  Concluir saída
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}