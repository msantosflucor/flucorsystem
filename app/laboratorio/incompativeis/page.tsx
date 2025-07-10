"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Truck, Clock, FlaskConical, AlertTriangle, ChevronLeft,
} from "lucide-react";
import FlucorLogo from "@/components/flucor-logo";
import UnitSelector from "@/components/unit-selector";

export default function IncompativeisPage() {
  const [analises, setAnalises] = useState<any[]>([]);
  const [selectedAnalise, setSelectedAnalise] = useState<any | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [unitColor, setUnitColor] = useState("#8B1A1A");
  const { toast } = useToast();
  const router = useRouter();

  async function carregarAnalises() {
    try {
      const res = await fetch("/api/laboratorio/incompativeis");
      const data = await res.json();
      setAnalises(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar análises." });
    }
  }

  async function liberarAnalise() {
    if (!justificativa.trim()) {
      toast({ variant: "destructive", title: "Justificativa obrigatória", description: "Informe o motivo da liberação." });
      return;
    }

    try {
      const res = await fetch(`/api/laboratorio/${selectedAnalise.id}/liberar-incompativel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificativa }),
      });

      if (res.ok) {
        toast({ title: "Amostra liberada com sucesso." });
        setModalAberto(false);
        setJustificativa("");
        setSelectedAnalise(null);
        carregarAnalises();
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Erro ao liberar", description: err?.error || "Erro desconhecido." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha na requisição." });
    }
  }

  async function rejeitarAnalise(analiseId: number) {
    try {
      const res = await fetch(`/api/laboratorio/${analiseId}/rejeitar`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast({ title: "Amostra rejeitada com sucesso." });
        carregarAnalises();
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Erro ao rejeitar", description: err?.error || "Erro desconhecido." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao rejeitar análise." });
    }
  }

  useEffect(() => {
    carregarAnalises();
  }, []);

  const handleUnitChange = (color: string) => {
    setUnitColor(color);
    toast({
      title: "Unidade alterada",
      description: "Você alterou para uma nova unidade.",
    });
  };

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho com logo e unidade */}
      <header className="mb-6 flex items-center justify-between">
        <FlucorLogo size="medium" unitColor={unitColor} />
        <div className="flex items-center gap-2">
          <UnitSelector currentUnitColor={unitColor} onUnitChange={handleUnitChange} />
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>
        </div>
      </header>

      <h1 className="text-2xl font-bold mb-4 text-center">Análises Incompatíveis</h1>

      {analises.length === 0 ? (
        <p className="text-muted-foreground text-center">Nenhuma análise incompatível pendente.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analises.map((analise) => (
            <Card key={analise.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {analise.caminhao.placa}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Entrada: {new Date(analise.caminhao.criadoEm).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Tanque: {analise.tanque || "Não informado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <Badge variant="destructive">Incompatível</Badge>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <Button variant="destructive" onClick={() => rejeitarAnalise(analise.id)}>Rejeitar</Button>
                  <Button onClick={() => {
                    setSelectedAnalise(analise);
                    setModalAberto(true);
                  }}>
                    Liberar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de justificativa */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa da Liberação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="justificativa" className="text-sm font-medium">Motivo</label>
            <Input
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva o motivo da liberação da carga incompatível"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button onClick={liberarAnalise}>Confirmar Liberação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
