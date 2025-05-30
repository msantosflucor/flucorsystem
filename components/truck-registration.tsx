"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  RadioGroup, RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Truck, CheckCircle2 } from "lucide-react";

export default function TruckRegistration() {
  const { toast } = useToast();
  const [plate, setPlate] = useState("");
  const [origin, setOrigin] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [waitingOption, setWaitingOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [caixas, setCaixas] = useState<any[]>([]);

  useEffect(() => {
    const fetchCaixas = async () => {
      try {
        const res = await fetch("/api/caixas");
        const data = await res.json();
        setCaixas(data);
      } catch (error) {
        console.error("Erro ao buscar caixas:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar caixas do banco.",
          variant: "destructive",
        });
      }
    };
    fetchCaixas();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!plate || !selectedBoxId || !waitingOption) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de registrar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const caixaSelecionada = caixas.find((c) => c.id === selectedBoxId);

      const res = await fetch("/api/caminhoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: plate,
          origem: origin,
          caixaId: selectedBoxId,
          aguardarNaCaixa: waitingOption === "wait",
          tipo: caixaSelecionada?.tipoResiduo || "Diversos",
        }),
      });

      if (!res.ok) throw new Error("Erro no cadastro");

      const data = await res.json();
      setGeneratedId(data.id);
      setIsSuccess(true);

      toast({
        title: "Caminhão registrado",
        description: `Placa ${plate} registrada na caixa ${caixaSelecionada?.nome}.`,
      });

      setTimeout(() => {
        setIsSuccess(false);
        setPlate("");
        setOrigin("");
        setSelectedBoxId(null);
        setWaitingOption("");
        setGeneratedId("");
      }, 3000);
    } catch (error) {
      console.error("Erro no registro:", error);
      toast({
        title: "Erro no registro",
        description: "Falha ao cadastrar caminhão.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Registro de Chegada de Caminhão
        </CardTitle>
        <CardDescription>
          Registre a chegada de um novo caminhão para coleta de amostra
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 text-green-600 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registro Concluído</h3>
            <p className="text-gray-500 mb-4">
              O caminhão {plate} foi registrado com sucesso.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">ID do Registro:</span>
                <span className="font-medium">{generatedId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Data/Hora:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Caixa Selecionada:</span>
                <span className="font-medium">
                  {caixas.find((c) => c.id === selectedBoxId)?.nome || ""}
                </span>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-sm font-medium">
                  Um registro de análise laboratorial foi criado automaticamente.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="plate">Placa do Caminhão</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  placeholder="Informe a origem"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="box">Selecione a Caixa para Coleta</Label>
                <Select
                  value={selectedBoxId ? String(selectedBoxId) : ""}
                  onValueChange={(value) => setSelectedBoxId(Number(value))}
                >
                  <SelectTrigger id="box" className="mt-1">
                    <SelectValue placeholder="Selecione uma caixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {caixas.length > 0 ? (
                      caixas.map((caixa) => (
                        <SelectItem key={caixa.id} value={String(caixa.id)}>
                          {caixa.nome} - {caixa.tipoResiduo}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500 p-2">
                        Nenhuma caixa disponível
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>O caminhão pode aguardar ou deve sair para o pátio?</Label>
                <RadioGroup
                  value={waitingOption}
                  onValueChange={setWaitingOption}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wait" id="wait" />
                    <Label htmlFor="wait" className="font-normal">
                      Pode aguardar na caixa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="leave" id="leave" />
                    <Label htmlFor="leave" className="font-normal">
                      Deve sair para o pátio
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      {!isSuccess && (
        <CardFooter className="flex justify-end">
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Caminhão"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
