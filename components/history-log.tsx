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
import { Toaster } from "@/components/ui/toaster";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/lib/logo-base64-validado";

interface Analysis {
  liberadaIncompativel: boolean;
  justificativaLiberacaoIncompativel: string | null;
  dataAnalise: Date;
}

interface HistoryRecord {
  id: string;
  caminhaoId: number;
  plate: string;
  motorista: string;
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

interface HistoryLogProps {
  onAtualizarEstacionamento?: () => void;
}

export default function HistoryLog({ onAtualizarEstacionamento }: HistoryLogProps) {
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [senhaDialogOpen, setSenhaDialogOpen] = useState(false);
  const [senha, setSenha] = useState("");

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
      showToast("Erro", "Falha ao carregar histórico", "destructive");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
    console.log(`Toast exibido: ${title} - ${description}`);
  };

  const confirmarDesfazerFinalizacao = async () => {
    if (!selectedRecord) return;
    
    setIsUndoing(true);
    
    try {
      const res = await fetch(`/api/historico/desfazer/${selectedRecord.caminhaoId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senha }),
      });

      const resultado = await res.json();
      console.log("Resposta da API:", resultado);

	if (!res.ok) {
	  if (res.status === 401) {
	    showToast("Erro", "Senha incorreta. Por favor, tente novamente.", "destructive");
	  } else {
	    showToast("Erro", resultado.error || "Falha ao desfazer finalização", "destructive");
	  }
	  setSenha("");
	  return;
	}

	showToast("Sucesso", "Finalização desfeita com sucesso");

	if (onAtualizarEstacionamento) {
	  await onAtualizarEstacionamento(); // Atualiza o estacionamento antes de limpar qualquer coisa
	}

	await fetchHistory(); // Atualiza histórico depois

	setSenha("");
	setSelectedRecord(null);
	setSenhaDialogOpen(false);
	setDetailsDialogOpen(false);
    } catch (err) {
      console.error("Erro inesperado:", err);
      showToast("Erro", "Erro inesperado ao desfazer finalização", "destructive");
    } finally {
      setIsUndoing(false);
    }
  };

  const desfazerFinalizacao = (caminhaoId: number) => {
    setSelectedRecord(historyData.find(item => item.caminhaoId === caminhaoId) || null);
    setSenhaDialogOpen(true);
  };

  const gerarRelatorioHistoricoPDF = () => {
    const doc = new jsPDF();
    const agora = new Date();
    const dataHora = agora.toLocaleString("pt-BR");

    doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
    doc.setFontSize(14);
    doc.text("Relatório de Descarregamentos", 75, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${dataHora}`, 75, 26);

    const rows = filteredData.map((item) => [
      item.plate,
      item.transportadora,
      item.motorista || "N/D",
      item.destination,
      item.horaInicioCarregamento ? "Carregamento" : item.manual ? "Manual" : "Automática",
      item.entryDate ? new Date(item.entryDate).toLocaleString("pt-BR") : "N/D",
      item.horaSaida ? new Date(item.horaSaida).toLocaleString("pt-BR") : "N/D",
      item.tempoLiberacaoMin != null ? `${item.tempoLiberacaoMin} min` : "N/D",
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Placa",
          "Transportadora",
          "Motorista",
          "Destino",
          "Autorização",
          "Entrada",
          "Saída",
          "Tempo Liberação",
        ],
      ],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [26, 64, 108],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`relatorio-historico-${agora.getTime()}.pdf`);
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
    <>
      <Toaster />
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
                <Button variant="outline" size="icon" onClick={gerarRelatorioHistoricoPDF}>
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
                  <div><strong>Motorista:</strong> {selectedRecord.motorista || "N/D"}</div>
                  <div><strong>Horário de chegada:</strong> {formatDateTime(selectedRecord.entryDate)}</div>

                  {selectedRecord.horaInicioCarregamento ? (
                    <div><strong>Horário da liberação:</strong> {formatDateTime(selectedRecord.analises?.[0]?.dataAnalise)}</div>
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

                {!selectedRecord?.horaSaida && (
                  <div className="pt-4">
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Saída pendente — registrar na Guarita (Controle de Acesso)
                    </Badge>
                  </div>
                )}

                {userRole === "SYSADMIN" && selectedRecord?.horaSaida && (
                  <div className="pt-2">
                    <Button
                      variant="destructive"
                      onClick={() => desfazerFinalizacao(selectedRecord.caminhaoId)}
                      className="w-full md:w-auto"
                      disabled={isUndoing}
                    >
                      {isUndoing ? "Processando..." : "Desfazer Finalização"}
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

        <Dialog open={senhaDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSenha("");
            setSenhaDialogOpen(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar ação</DialogTitle>
              <DialogDescription>
                Digite sua senha para desfazer a finalização do caminhão {selectedRecord?.plate}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmarDesfazerFinalizacao();
              }}
            >
              <div className="py-4">
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSenha("");
                    setSenhaDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!senha || isUndoing}
                >
                  {isUndoing ? "Processando..." : "Confirmar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}