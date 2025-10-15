"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, FlaskConical, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Caminhao = {
  id: number;
  placa: string;
  transportadora?: string;
  criadoEm: string;
  status: string;
  carregamento?: boolean;
  horaColeta?: string | null;
  analises?: any[];
  caixa?: { nome: string; tipoResiduo: string } | null;
};

type RegistroPos = {
  id: number;
  criadoEm: string;
  caminhao?: { id: number; placa?: string } | null;
  motivo: string;
  status: "ABERTA" | "LIBERADA_PENDENTE_ANALISE" | "FINALIZADA" | "CANCELADA";
  amostraPendente: boolean;
};

export default function PosHorario() {
  const [activeTab, setActiveTab] = useState("registros");
  const [estadoLab, setEstadoLab] = useState<{ fechado: boolean; janela: { inicio: string; fim: string } | null } | null>(null);

  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [historico, setHistorico] = useState<RegistroPos[]>([]);
  const [buscaPlaca, setBuscaPlaca] = useState("");

  // criar pendência
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("Laboratório fechado (22h–06h) / Domingo");
  const [liberarFluxo, setLiberarFluxo] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchEstado = async () => {
    const r = await fetch("/api/estado-lab", { cache: "no-store" });
    const j = await r.json();
    setEstadoLab(j);
  };

  const fetchCaminhoes = async () => {
    if (estadoLab == null) {
      setCaminhoes([]);
      return;
    }

    // SEMPRE busca apenas caminhões do pós-horário
    const url = "/api/caminhoes?para=poshorario";

    try {
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      setCaminhoes(Array.isArray(j) ? j : []);
    } catch {
      setCaminhoes([]);
    }
  };

  const fetchHistorico = async () => {
    const r = await fetch("/api/poshorario", { cache: "no-store" });
    const j = await r.json();
    setHistorico(j?.data ?? []);
  };

  useEffect(() => {
    (async () => {
      await fetchEstado();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchCaminhoes(), fetchHistorico()]);
    })();
  }, [estadoLab?.fechado]);

  const onCriar = async () => {
    if (!selectedId) {
      toast({ title: "Selecione um caminhão", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/poshorario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caminhaoId: selectedId, motivo, liberarFluxo }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Falha ao criar pendência");
      }
      toast({ title: "Pendência criada", description: "Gerada a pendência de amostra para o laboratório." });
      setDialogOpen(false);
      setSelectedId(null);
      await Promise.all([fetchCaminhoes(), fetchHistorico()]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const formatDateTime = (s?: string) => (s ? format(new Date(s), "dd/MM/yyyy HH:mm") : "N/A");

  const banner = useMemo(() => {
    if (!estadoLab) return null;
    if (estadoLab.fechado) {
      const janelaTxt = estadoLab.janela ? `Janela: ${formatDateTime(estadoLab.janela.inicio)} → ${formatDateTime(estadoLab.janela.fim)}` : "";
      return (
        <div className="p-3 rounded-md border bg-yellow-50 text-yellow-900">
          <strong>Laboratório fechado.</strong> Operações redirecionadas para Pós-Horário. {janelaTxt}
        </div>
      );
    }
    return (
      <div className="p-3 rounded-md border bg-green-50 text-green-900 flex items-center justify-between gap-2">
        <span><strong>Laboratório aberto.</strong> Pós-Horário em modo leitura (histórico).</span>
        <Button size="sm" onClick={() => router.push("/laboratorio")}>Ir para Análise Laboratorial</Button>
      </div>
    );
  }, [estadoLab]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="registros">Registros (Pós-Horário)</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <div className="w-[220px]">
          <Input placeholder="Buscar por placa..." value={buscaPlaca} onChange={(e) => setBuscaPlaca(e.target.value.toUpperCase())}/>
        </div>
      </div>

      {banner}

      <TabsContent value="registros">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">
            {estadoLab?.fechado 
              ? "Listando caminhões que entraram durante o horário de fechamento do laboratório." 
              : "Laboratório aberto — sem caminhões do pós-horário para exibir."}
          </div>
          {estadoLab?.fechado && (
            <Button onClick={() => setDialogOpen(true)} disabled={caminhoes.length === 0}>
              Nova Pendência
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caminhoes
            .filter(c => c.placa?.toUpperCase().includes(buscaPlaca))
            .map(c => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center gap-2">
                    <span>Placa: {c.placa}</span>
                    <Badge variant="outline">{c.carregamento ? "Carregamento" : "Entrada"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><strong>Transportadora:</strong> {c.transportadora ?? "—"}</div>
                  <div><strong>Entrada:</strong> {formatDateTime(c.criadoEm)}</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getTimeElapsed(c.criadoEm)} min</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {estadoLab?.fechado ? (
                    <Button onClick={() => { setSelectedId(c.id); setDialogOpen(true); }}>
                      Gerar Pendência
                    </Button>
                  ) : (
                    <Button onClick={() => router.push("/laboratorio")} variant="outline">
                      Ir para Laboratório
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
        </div>

        {caminhoes.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {estadoLab?.fechado
              ? "Nenhum caminhão elegível no período de fechamento do laboratório."
              : "Sem registros do pós-horário para visualizar."}
          </p>
        )}
      </TabsContent>

      <TabsContent value="historico">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pós-Horário</CardTitle>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Caminhão</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Amostra</th>
                      <th className="py-2 pr-4">Motivo</th>
                      <th className="py-2 pr-4">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 pr-4">{r.id}</td>
                        <td className="py-2 pr-4">{r.caminhao?.placa ?? `#${r.caminhao?.id ?? "—"}`}</td>
                        <td className="py-2 pr-4">{r.status}</td>
                        <td className="py-2 pr-4">{r.amostraPendente ? "Pendente" : "OK"}</td>
                        <td className="py-2 pr-4">{r.motivo}</td>
                        <td className="py-2 pr-4">{formatDateTime(r.criadoEm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dialog para criar pendência */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Pendência Pós-Horário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ID do Caminhão</Label>
              <Input type="number" value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))}/>
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}/>
            </div>
            <div className="flex items-center gap-2">
              <input id="liberar" type="checkbox" checked={liberarFluxo} onChange={(e) => setLiberarFluxo(e.target.checked)} />
              <Label htmlFor="liberar">Liberar descarregamento/carregamento (gera pendência de amostra)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={onCriar} disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}