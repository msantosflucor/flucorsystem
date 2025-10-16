"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type TipoResiduo = "Diversos" | "Oleoso" | "Alcalino" | "Acidos" | "Lodo" | "";

export default function PosHorario() {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetalhes, setSelectedDetalhes] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [tanque, setTanque] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tipoResiduo, setTipoResiduo] = useState<TipoResiduo>("");
  const [origem, setOrigem] = useState("");
  const [responsavelLiberacao, setResponsavelLiberacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [buscaPlaca, setBuscaPlaca] = useState("");
  const [estadoLab, setEstadoLab] = useState<{ fechado: boolean; janela: { inicio: string; fim: string } | null } | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const fetchEstado = async () => {
    try {
      const r = await fetch("/api/estado-lab", { cache: "no-store" });
      const j = await r.json();
      setEstadoLab(j);
    } catch (err) {
      console.error("Erro ao buscar estado do laboratório:", err);
    }
  };

  const fetchCaminhoes = async () => {
    try {
      // Busca caminhões específicos para pós-horário
      const res = await fetch("/api/caminhoes?para=poshorario", { credentials: "include" });
      const data = await res.json();
      setCaminhoes(data);
    } catch (err) {
      console.error("Erro ao buscar caminhões:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar caminhões",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEstado();
    fetchCaminhoes();
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const role = data?.user?.role;
        setUserRole(role);
      })
      .catch(() => setUserRole(null));
  }, []);

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const sample = caminhoes.find((c) => c.id === selectedId);

  // Hidrata/re-hidrata o formulário quando o sample muda
  useEffect(() => {
    if (!sample) return;

    const ultimaAnalise = (sample.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    setOrigem((prev) => prev || (ultimaAnalise?.origem ?? ""));
    setTanque((prev) => prev || (ultimaAnalise?.tanque ?? ""));
    setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
    setObservacoes((prev) => prev || (ultimaAnalise?.observacoes ?? ""));
    setResponsavelLiberacao((prev) => prev || (ultimaAnalise?.responsavelLiberacao ?? ""));

    if (sample.carregamento) {
      const destino = ultimaAnalise?.destino ?? "";
      setStatus((prev) => prev || destino);
      if (destino === "Outros") {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.outroDestino ?? ""));
      } else {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
      }
    } else {
      setStatus((prev) => prev || (ultimaAnalise?.status ?? ""));
    }
  }, [sample?.id, sample?.analises?.length]);

  const openDetalhesDialog = (caminhao: any) => {
    const ultimaAnalise = (caminhao.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0] || null;

    setSelectedDetalhes({ ...caminhao, ultimaAnalise });
    setDetailsDialogOpen(true);
  };

  const openAnalysisDialog = (caminhao: any) => {
    setSelectedId(caminhao.id);
    
    const ultimaAnalise = (caminhao.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    setOrigem(ultimaAnalise?.origem ?? "");
    setTanque(ultimaAnalise?.tanque ?? "");
    setTipoResiduo(ultimaAnalise?.tipoResiduo ?? "");
    setObservacoes(ultimaAnalise?.observacoes ?? "");
    setResponsavelLiberacao(ultimaAnalise?.responsavelLiberacao ?? "");

    if (caminhao.carregamento) {
      setStatus(ultimaAnalise?.destino ?? "");
    } else {
      setStatus(ultimaAnalise?.status ?? "");
    }

    setAnalysisDialogOpen(true);
  };

  const coletarAmostra = async (id: number) => {
    if (!window.confirm("Confirmar coleta?")) return;

    try {
      const res = await fetch(`/api/caminhoes/${id}/coletar`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao registrar coleta");

      toast({
        title: "Coleta registrada",
        description: "Amostra coletada com sucesso",
      });

      await fetchCaminhoes();
    } catch (err) {
      console.error("Falha na coleta:", err);
      toast({
        title: "Erro na coleta",
        description: "Não foi possível registrar a coleta.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedId || !tanque || !tipoResiduo || !responsavelLiberacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    if (status === "incompatible" && !observacoes) {
      toast({
        title: "Observações obrigatórias",
        description: "Preencha as observações para análises incompatíveis.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sample = caminhoes.find((c) => c.id === selectedId);
      
      if (sample?.carregamento) {
        // Para carregamento
        await fetch(`/api/laboratorio`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caminhaoId: selectedId,
            tanque,
            observacoes,
            destino: status,
            outroDestino: status === "Outros" ? tipoResiduo : null,
            tipoResiduo,
            origem,
            responsavelLiberacao,
            status: "approved",
          }),
        });

        await fetch(`/api/laboratorio/${selectedId}/liberar-carregamento`, {
          method: "PATCH",
          credentials: "include",
        });

        toast({
          title: "Carregamento liberado",
          description: "O caminhão foi liberado para carregamento.",
        });
      } else {
        // Para análise normal
        await fetch("/api/laboratorio", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caminhaoId: selectedId,
            status,
            tanque,
            observacoes,
            tipoResiduo,
            origem,
            responsavelLiberacao,
          }),
        });

        toast({
          title: "Análise registrada",
          description: "Dados da análise salvos com sucesso",
        });
      }

      await fetchCaminhoes();
      setAnalysisDialogOpen(false);
      setSelectedId(null);
      setStatus("");
      setTanque("");
      setObservacoes("");
      setTipoResiduo("");
      setOrigem("");
      setResponsavelLiberacao("");
    } catch (err) {
      console.error("Erro ao registrar análise:", err);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a análise.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegarCarregamento = async (id: number) => {
    try {
      await fetch(`/api/laboratorio/${id}/negar-carregamento`, {
        method: "PATCH",
        credentials: "include",
      });
      toast({
        title: "Carregamento negado",
        description: "O caminhão foi recusado para carregamento.",
      });
      await fetchCaminhoes();
    } catch (err) {
      console.error("Erro ao negar carregamento:", err);
      toast({
        title: "Erro",
        description: "Não foi possível negar o carregamento.",
        variant: "destructive",
      });
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "waiting": return "Aguardando";
      case "in_progress": return "Em Análise";
      case "approved": return "Liberado";
      case "incompatible": return "Incompatível";
      default: return "Indefinido";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "waiting": return "bg-yellow-50 border-yellow-300 text-yellow-700";
      case "in_progress": return "bg-blue-50 border-blue-300 text-blue-700";
      case "approved": return "bg-green-50 border-green-300 text-green-700";
      case "incompatible": return "bg-red-50 border-red-300 text-red-700";
      default: return "bg-muted";
    }
  };

  const formatDateTime = (dateString: string) => {
    return dateString ? format(new Date(dateString), "dd/MM/yyyy HH:mm") : "N/A";
  };

  const banner = estadoLab?.fechado ? (
    <div className="p-3 rounded-md border bg-yellow-50 text-yellow-900 mb-4">
      <strong>Modo Pós-Horário Ativo.</strong> Laboratório fechado - Operações em modo pós-horário.
      {estadoLab.janela && (
        <span className="ml-2">
          Janela: {formatDateTime(estadoLab.janela.inicio)} → {formatDateTime(estadoLab.janela.fim)}
        </span>
      )}
    </div>
  ) : (
    <div className="p-3 rounded-md border bg-green-50 text-green-900 mb-4 flex items-center justify-between gap-2">
      <span><strong>Laboratório aberto.</strong> Pós-horário em modo leitura.</span>
      <Button size="sm" onClick={() => router.push("/laboratorio")}>Ir para Análise Laboratorial</Button>
    </div>
  );

  const caminhoesFiltrados = caminhoes
    .filter(c => c.status !== "finalizado")
    .filter(c => c.placa.toUpperCase().includes(buscaPlaca));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pós-Horário</h1>
        
        <div className="w-[200px]">
          <Input
            placeholder="Buscar por placa..."
            value={buscaPlaca}
            onChange={(e) => setBuscaPlaca(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {banner}

      {/* LISTA - PÓS-HORÁRIO */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caminhoesFiltrados.map(c => {
          const ultimaAnalise = c.analises?.[0];
          const podeAnalisar = !!c.horaColeta && (
            !ultimaAnalise ||
            ultimaAnalise.status !== "incompatible" ||
            ultimaAnalise.liberadaIncompativel === true
          );

          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span>Placa: {c.placa}</span>
                    {c.carregamento && (
                      <span title="Carregamento" className="text-xl">🚚📦</span>
                    )}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                      Pós-Horário
                    </Badge>
                  </div>
                  <Badge className={statusColor(c.status)}>
                    {statusLabel(c.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Transportadora:</strong> {c.transportadora}</div>
                {c.carregamento ? (
                  <div><strong>Tanque:</strong> {c.analises?.[0]?.tanque || "N/D"}</div>
                ) : (
                  <div><strong>Caixa:</strong> {c.caixa ? `${c.caixa.nome} - ${c.caixa.tipoResiduo}` : "N/A"}</div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{getTimeElapsed(c.criadoEm)} min</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => openDetalhesDialog(c)}>
                  Detalhes
                </Button>
                {c.carregamento ? (
                  <>
                    <Button onClick={() => openAnalysisDialog(c)}>
                      Analisar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleNegarCarregamento(c.id)}
                    >
                      Negar
                    </Button>
                  </>
                ) : !c.horaColeta ? (
                  <Button variant="outline" onClick={() => coletarAmostra(c.id)}>
                    Coletar
                  </Button>
                ) : (
                  <Button onClick={() => openAnalysisDialog(c)} disabled={!podeAnalisar}>
                    Analisar
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {caminhoesFiltrados.length === 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          {estadoLab?.fechado
            ? "Nenhum caminhão elegível no período de pós-horário."
            : "Sem registros do pós-horário para visualizar."}
        </p>
      )}

      {/* MODAL DE ANÁLISE */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {sample?.carregamento ? "Registrar Carregamento - Pós-Horário" : "Registrar Análise - Pós-Horário"}
            </DialogTitle>
          </DialogHeader>

          {sample && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4 bg-gray-50 rounded-md">
                <div><strong>ID:</strong> {sample.id}</div>
                <div><strong>Placa:</strong> {sample.placa ?? "—"}</div>
                <div><strong>Transportadora:</strong> {sample.transportadora ?? "—"}</div>
                {sample.carregamento ? (
                  <div><strong>Tipo:</strong> Carregamento</div>
                ) : (
                  <div><strong>Caixa:</strong> {sample.caixa ? `${sample.caixa?.nome ?? "—"} - ${sample.caixa?.tipoResiduo ?? "—"}` : "N/A"}</div>
                )}
                <div><strong>Entrada:</strong> {formatDateTime(sample.criadoEm)}</div>
                {sample.horaColeta && (
                  <div><strong>Coleta:</strong> {formatDateTime(sample.horaColeta)}</div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tanque de Destino *</Label>
                  <Input
                    placeholder="TQ01, TQ02, IBC, Tambor..."
                    value={tanque}
                    onChange={(e) => setTanque(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Origem</Label>
                  <Input
                    placeholder="Unidade Araquari, Fábrica 2, etc."
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tipo de Resíduo *</Label>
                  <select
                    className="w-full border p-2 rounded"
                    value={tipoResiduo}
                    onChange={(e) => setTipoResiduo(e.target.value as TipoResiduo)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Diversos">Diversos</option>
                    <option value="Oleoso">Oleoso</option>
                    <option value="Alcalino">Alcalino</option>
                    <option value="Acidos">Ácido</option>
                    <option value="Lodo">Lodo</option>
                  </select>
                </div>

                <div>
                  <Label>Responsável pela Liberação *</Label>
                  <Input
                    placeholder="Nome do responsável"
                    value={responsavelLiberacao}
                    onChange={(e) => setResponsavelLiberacao(e.target.value)}
                  />
                </div>

                {sample.carregamento ? (
                  <div>
                    <Label>Destino</Label>
                    <select
                      className="w-full border p-2 rounded"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Beneficiamento">Beneficiamento</option>
                      <option value="Coprocessamento">Coprocessamento</option>
                      <option value="Venda">Venda</option>
                      <option value="Destinação">Destinação</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Status da Análise</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={status === "approved" ? "default" : "outline"}
                        className={status === "approved" ? "bg-green-600 text-white" : ""}
                        onClick={() => setStatus("approved")}
                      >
                        Liberado
                      </Button>
                      <Button
                        variant={status === "incompatible" ? "default" : "outline"}
                        className={status === "incompatible" ? "bg-red-600 text-white" : ""}
                        onClick={() => setStatus("incompatible")}
                      >
                        Incompatível
                      </Button>
                    </div>
                  </div>
                )}

                {status === "Outros" && (
                  <div>
                    <Label>Descrever Destino</Label>
                    <Input
                      placeholder="Descreva o destino..."
                      value={tipoResiduo}
                      onChange={(e) => setTipoResiduo(e.target.value as TipoResiduo)}
                    />
                  </div>
                )}

                <div>
                  <Label>Observações {status === "incompatible" && "*"}</Label>
                  <Textarea
                    placeholder="Observações relevantes..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>

                {status === "incompatible" && !observacoes && (
                  <div className="flex items-start gap-2 p-4 border border-red-300 bg-red-50 rounded-md">
                    <AlertTriangle className="text-red-600 mt-1" />
                    <p className="text-sm text-red-800">Observações obrigatórias para status Incompatível.</p>
                  </div>
                )}

                {status === "approved" && (
                  <div className="flex items-start gap-2 p-4 border border-green-300 bg-green-50 rounded-md">
                    <CheckCircle2 className="text-green-600 mt-1" />
                    <p className="text-sm text-green-800">
                      {sample.carregamento 
                        ? "Carregamento será liberado." 
                        : `Amostra será enviada para o tanque ${tanque}.`}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Registrando..." : "Registrar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDetalhes?.carregamento ? "Detalhes do Carregamento - Pós-Horário" : "Detalhes do Registro - Pós-Horário"}
            </DialogTitle>
          </DialogHeader>

          {selectedDetalhes && (
            <div className="space-y-2 text-sm">
              <div><strong>Placa:</strong> {selectedDetalhes.placa ?? "—"}</div>
              <div><strong>Transportadora:</strong> {selectedDetalhes.transportadora ?? "—"}</div>

              {selectedDetalhes.carregamento ? (
                <div>
                  <strong>Destino:</strong>{" "}
                  {selectedDetalhes.ultimaAnalise?.destino === "Outros"
                    ? selectedDetalhes.ultimaAnalise?.outroDestino || "—"
                    : selectedDetalhes.ultimaAnalise?.destino || "—"}
                </div>
              ) : (
                <div>
                  <strong>Caixa:</strong>{" "}
                  {selectedDetalhes.caixa
                    ? `${selectedDetalhes.caixa?.nome ?? "—"} - ${selectedDetalhes.caixa?.tipoResiduo ?? "—"}`
                    : "N/A"}
                </div>
              )}

              <div><strong>Entrada:</strong> {formatDateTime(selectedDetalhes.criadoEm)}</div>

              <div>
                <strong>{selectedDetalhes.carregamento ? "Hora da Liberação" : "Hora da Coleta"}:</strong>{" "}
                {selectedDetalhes.horaColeta
                  ? formatDateTime(selectedDetalhes.horaColeta)
                  : selectedDetalhes.carregamento
                    ? "Aguardando liberação"
                    : "Aguardando coleta"}
              </div>

              <div><strong>Status:</strong> {statusLabel(selectedDetalhes.status)}</div>
              <div><strong>Tanque:</strong> {selectedDetalhes.ultimaAnalise?.tanque || "—"}</div>
              <div><strong>Tipo de Resíduo:</strong> {selectedDetalhes.ultimaAnalise?.tipoResiduo || "—"}</div>
              <div><strong>Origem:</strong> {selectedDetalhes.ultimaAnalise?.origem || "—"}</div>
              <div><strong>Responsável:</strong> {selectedDetalhes.ultimaAnalise?.responsavelLiberacao || "—"}</div>
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
    </div>
  );
}