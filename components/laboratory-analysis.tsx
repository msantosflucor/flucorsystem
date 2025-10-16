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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type TipoResiduo = "Diversos" | "Oleoso" | "Alcalino" | "Acidos" | "Lodo" | "";

export default function LaboratoryAnalysis() {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetalhes, setSelectedDetalhes] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [tanque, setTanque] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tipoResiduo, setTipoResiduo] = useState<TipoResiduo>("");
  const [origem, setOrigem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [buscaPlaca, setBuscaPlaca] = useState("");

  // Estados opcionais (pós-operação)
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [lacreNumero, setLacreNumero] = useState("");
  const [posObs, setPosObs] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const fetchCaminhoes = async () => {
    try {
      console.log("🔬 [Frontend] Buscando caminhões para laboratório...");
      const res = await fetch("/api/caminhoes?para=laboratorio", { credentials: "include" });
      const data = await res.json();
      console.log(`🔬 [Frontend] Recebidos ${data.length} caminhões`, data);
      setCaminhoes(data);
    } catch (err) {
      console.error("❌ [Frontend] Erro ao buscar caminhões:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar caminhões",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCaminhoes();
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const role = data?.user?.role;
        setUserRole(role);
      })
      .catch(() => setUserRole(null));
  }, []);

  const getTimeElapsed = (createdAt: string | Date | null | undefined) => {
    const ts = createdAt ? new Date(createdAt) : null;
    if (!ts || isNaN(ts.getTime())) return 0;
    const diff = Date.now() - ts.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  const sample = caminhoes.find((c) => c.id === selectedId);
  const carregamentoFinalizado = !!sample?.horaFimCarregamento;

  // Hidrata/re-hidrata o formulário quando o sample muda (sempre pega a última análise)
  useEffect(() => {
    if (!sample) return;

    const ultimaAnalise = (sample.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    setOrigem((prev) => prev || (ultimaAnalise?.origem ?? ""));
    setTanque((prev) => prev || (ultimaAnalise?.tanque ?? ""));
    setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
    setObservacoes((prev) => prev || (ultimaAnalise?.observacoes ?? ""));

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
  }, [sample?.id, sample?.analises?.length, sample?.horaFimCarregamento]);

  const handleSelecionar = (id: number) => {
    const selected = caminhoes.find(c => c.id === id);
    if (!selected) return; // <- evita crash
    const ultimaAnalise = (selected.analises ?? [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    setSelectedId(id);
    setOrigem((prev) => prev || (ultimaAnalise?.origem ?? ""));
    setTanque((prev) => prev || (ultimaAnalise?.tanque ?? ""));
    setObservacoes((prev) => prev || (ultimaAnalise?.observacoes ?? ""));

    if (selected?.carregamento) {
      setStatus((prev) => prev || (ultimaAnalise?.destino ?? ""));
      if ((ultimaAnalise?.destino ?? "") === "Outros") {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.outroDestino ?? ""));
      } else {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
      }
    } else {
      setStatus((prev) => prev || (ultimaAnalise?.status ?? ""));
      setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
    }

    setActiveTab(selected?.carregamento ? "carregamento" : "analysis");
  };

  const openDetalhesDialog = (caminhao: any) => {
    const ultimaAnalise = (caminhao.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0] || null;

    setSelectedDetalhes({ ...caminhao, ultimaAnalise });
    setDetailsDialogOpen(true);
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
    if (!selectedId || !status || !tanque || !tipoResiduo) {
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
      const res = await fetch("/api/laboratorio", {
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
        }),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      toast({
        title: "Análise registrada",
        description: "Dados da análise salvos com sucesso",
      });

      await fetchCaminhoes();
      setSelectedId(null);
      setStatus("");
      setTanque("");
      setObservacoes("");
      setTipoResiduo("");
      setOrigem("");
      setActiveTab("pending");
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
      default: return "border border-gray-200 text-gray-600 bg-white";
    }
  };

  const formatDateTime = (dateString: string) => {
    return dateString ? format(new Date(dateString), "dd/MM/yyyy HH:mm") : "N/A";
  };

  // CORREÇÃO: Remove o filtro por status já que a API já filtra
  const caminhoesFiltrados = caminhoes.filter((c) => {
    const placa = (c?.placa ?? "").toString().toUpperCase();
    return placa.includes(buscaPlaca);
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="pending">
            Registros ({caminhoesFiltrados.length})
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            disabled={!sample || sample?.carregamento}
          >
            Registrar Análise
          </TabsTrigger>
          <TabsTrigger
            value="carregamento"
            disabled={!selectedId || !sample?.carregamento}
          >
            Registrar Carregamento
          </TabsTrigger>
        </TabsList>

        <div className="w-[200px]">
          <Input
            placeholder="Buscar por placa..."
            value={buscaPlaca}
            onChange={(e) => setBuscaPlaca(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {/* Diagnóstico visível */}
      {process.env.NODE_ENV !== "production" && (
        <pre className="text-xs p-2 bg-gray-50 border rounded max-h-40 overflow-auto">
          {JSON.stringify({ qtd: caminhoes?.length ?? 0, exemplo: caminhoes?.[0] ?? null }, null, 2)}
        </pre>
      )}

      {/* LISTA */}
      <TabsContent value="pending">
        {(userRole === "SYSADMIN" || userRole === "QUIMICO") && (
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.push("/laboratorio/incompativeis")}>
              Ver Análises Incompatíveis
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caminhoesFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhum caminhão encontrado para análise laboratorial
            </div>
          ) : (
            caminhoesFiltrados.map(c => {
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
                        <span>Placa: {c.placa ?? "—"}</span>
                        {c.carregamento && (
                          <span title="Carregamento" className="text-xl">🚚📦</span>
                        )}
                      </div>
                      <Badge className={statusColor(c.status)}>
                        {statusLabel(c.status)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div><strong>Transportadora:</strong> {c.transportadora ?? "—"}</div>
                    {c.carregamento ? (
                      <div><strong>Tanque:</strong> {c.analises?.[0]?.tanque ?? "N/D"}</div>
                    ) : (
                      <div><strong>Caixa:</strong> {c.caixa ? `${c.caixa?.nome ?? "—"} - ${c.caixa?.tipoResiduo ?? "—"}` : "N/A"}</div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{getTimeElapsed(c?.criadoEm)} min</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button variant="secondary" onClick={() => openDetalhesDialog(c)}>
                      Detalhes
                    </Button>
                    {c.carregamento ? (
                      <Button onClick={() => handleSelecionar(c.id)}>
                        Analisar
                      </Button>
                    ) : !c.horaColeta ? (
                      <Button variant="outline" onClick={() => coletarAmostra(c.id)}>
                        Coletar
                      </Button>
                    ) : (
                      <Button onClick={() => handleSelecionar(c.id)} disabled={!podeAnalisar}>
                        Analisar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </TabsContent>

      {/* ABA: REGISTRAR ANÁLISE */}
      <TabsContent value="analysis">
        {!sample || sample?.carregamento ? (
          <div className="text-sm text-muted-foreground">
            Selecione um registro elegível na aba <strong>Registros</strong> para analisar.
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            {/* Cabeçalho do sample */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4 bg-gray-50 rounded-md">
              <div><strong>ID:</strong> {sample.id}</div>
              <div><strong>Placa:</strong> {sample.placa ?? "—"}</div>
              <div><strong>Transportadora:</strong> {sample.transportadora ?? "—"}</div>
              <div><strong>Caixa:</strong> {sample.caixa ? `${sample.caixa?.nome ?? "—"} - ${sample.caixa?.tipoResiduo ?? "—"}` : "N/A"}</div>
              <div><strong>Entrada:</strong> {formatDateTime(sample.criadoEm)}</div>
              {sample.horaColeta && (
                <div><strong>Coleta:</strong> {formatDateTime(sample.horaColeta)}</div>
              )}
            </div>

            {/* Formulário de análise */}
            <div className="space-y-4">
              <div>
                <Label>Tanque de Destino *</Label>
                <Input
                  placeholder="TQ01, TQ02, etc."
                  value={tanque}
                  onChange={(e) => setTanque(e.target.value)}
                />
              </div>

              <div>
                <Label>Origem</Label>
                <Input
                  placeholder="Unidade/Setor (opcional)"
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
                  <p className="text-sm text-green-800">Amostra será enviada para o tanque {tanque}.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setSelectedId(null);
                setStatus(""); setTanque(""); setObservacoes(""); setTipoResiduo(""); setOrigem("");
                setActiveTab("pending");
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* ABA: REGISTRAR CARREGAMENTO */}
      <TabsContent value="carregamento">
        {!sample || !sample?.carregamento ? (
          <div className="text-sm text-muted-foreground">
            Selecione um registro de <strong>Carregamento</strong> na aba <strong>Registros</strong> para preencher.
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            {/* Cabeçalho do sample */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-4 bg-gray-50 rounded-md">
              <div><strong>ID:</strong> {sample.id}</div>
              <div><strong>Placa:</strong> {sample.placa ?? "—"}</div>
              <div><strong>Transportadora:</strong> {sample.transportadora ?? "—"}</div>
              <div><strong>Tipo:</strong> Carregamento</div>
              <div><strong>Entrada:</strong> {formatDateTime(sample.criadoEm)}</div>
              {sample.horaColeta && (
                <div><strong>Coleta:</strong> {formatDateTime(sample.horaColeta)}</div>
              )}
            </div>

            {/* Formulário de carregamento */}
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
                  placeholder="Unidade/Setor (opcional)"
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
                <Label>Destino *</Label>
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
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações relevantes..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setSelectedId(null);
                setStatus(""); setTanque(""); setObservacoes(""); setTipoResiduo(""); setOrigem("");
                setActiveTab("pending");
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* MODAL DE DETALHES */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDetalhes?.carregamento ? "Detalhes do Carregamento" : "Detalhes da Análise"}
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

      {/* MODAL PÓS-OPERAÇÃO (opcional) */}
      <Dialog open={posDialogOpen} onOpenChange={setPosDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Finalização – Lacre</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Número do Lacre</Label>
              <Input
                placeholder="Ex.: FLU-001234"
                value={lacreNumero}
                onChange={(e) => setLacreNumero(e.target.value)}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Anotações finais (opcional)"
                rows={3}
                value={posObs}
                onChange={(e) => setPosObs(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                // TODO: chamar endpoint de finalização, se aplicável
                // await fetch(`/api/laboratorio/${selectedId}/finalizar`, { method: "PATCH", ... })
                setPosDialogOpen(false);
                setLacreNumero(""); setPosObs("");
              }}
              disabled={!selectedId || !lacreNumero}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}