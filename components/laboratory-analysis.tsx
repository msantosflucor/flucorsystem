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
  
  // Estados novos (pós-análise)
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [lacreNumero, setLacreNumero] = useState("");
  const [posObs, setPosObs] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const fetchCaminhoes = async () => {
    try {
      // Busca apenas caminhões do horário normal (não pós-horário)
      const res = await fetch("/api/caminhoes?para=laboratorio", { credentials: "include" });
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
  
  // Flag pra saber se o carregamento já foi finalizado
  const carregamentoFinalizado = !!sample?.horaFimCarregamento;

  // Efeito para hidratar/re-hidratar o formulário quando o sample mudar
  useEffect(() => {
    if (!sample) return;

    // pega SEMPRE a última análise por criadoEm
    const ultimaAnalise = (sample.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    // Origem: tenta da análise; se não tiver, fica vazio (sem fallback para sample.origem)
    setOrigem((prev) => prev || (ultimaAnalise?.origem ?? ""));

    // Tanque / Tipo / Observações (se ainda vazios localmente)
    setTanque((prev) => prev || (ultimaAnalise?.tanque ?? ""));
    setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
    setObservacoes((prev) => prev || (ultimaAnalise?.observacoes ?? ""));

    if (sample.carregamento) {
      const destino = ultimaAnalise?.destino ?? "";
      setStatus((prev) => prev || destino);

      if (destino === "Outros") {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.outroDestino ?? ""));
      } else {
        // só preenche tipoResiduo se ainda estiver vazio e não for "Outros"
        setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
      }
    } else {
      // Na aba "analysis", 'status' é o status da análise (approved/in_progress/incompatible)
      setStatus((prev) => prev || (ultimaAnalise?.status ?? ""));
    }
  }, [
    sample?.id,
    // se mudar qtd de análises ou timestamps, re-hidrata
    sample?.analises?.length,
    sample?.horaFimCarregamento,
  ]);

  const handleSelecionar = (id: number) => {
    const selected = caminhoes.find(c => c.id === id);
    const ultimaAnalise = (selected?.analises || [])
      .slice()
      .sort((a: any, b: any) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())[0];

    setSelectedId(id);

    // Origem sempre vinda da última análise; não cair para sample.origem
    setOrigem((prev) => prev || (ultimaAnalise?.origem ?? ""));

    // Tanque / Observações
    setTanque((prev) => prev || (ultimaAnalise?.tanque ?? ""));
    setObservacoes((prev) => prev || (ultimaAnalise?.observacoes ?? ""));

    if (selected?.carregamento) {
      // *** EM CARREGAMENTO: status do form é o DESTINO ***
      setStatus((prev) => prev || (ultimaAnalise?.destino ?? ""));
      // "Outros" usa outroDestino no input auxiliar
      if ((ultimaAnalise?.destino ?? "") === "Outros") {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.outroDestino ?? ""));
      } else {
        setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
      }
    } else {
      // *** EM ANÁLISE: status do form é o status da análise ***
      setStatus((prev) => prev || (ultimaAnalise?.status ?? ""));
      setTipoResiduo((prev) => prev || (ultimaAnalise?.tipoResiduo ?? ""));
    }

    setActiveTab(selected?.carregamento ? "carregamento" : "analysis");
  };

  const openDetalhesDialog = (caminhao: any) => {
    const ultimaAnalise = caminhao.analises?.[0] || null;
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
          origem
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

  const statusLabel = (status: string) => {
    switch (status) {
      case "waiting": return "Aguardando";
      case "in_progress": return "Em Análise";
      case "approved": return "Liberado";
      case "incompatible": return "Incompatível";
      default: return "Indefinido";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="pending">Registros</TabsTrigger>
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

      <TabsContent value="pending">
        {(userRole === "SYSADMIN" || userRole === "QUIMICO") && (
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.push("/laboratorio/incompativeis")}>
              Ver Análises Incompatíveis
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caminhoes
            .filter(c => c.status !== "finalizado")
            .filter(c => c.placa.toUpperCase().includes(buscaPlaca))
            .map(c => {
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
            })}
        </div>
      </TabsContent>

      {/* ... restante do código permanece igual ... */}
    </Tabs>
  );
}