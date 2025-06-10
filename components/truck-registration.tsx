"use client";

import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck, CheckCircle2 } from "lucide-react";

export default function TruckRegistration() {
  const { toast } = useToast();
  const [plate, setPlate] = useState("");
  const [motorista, setMotorista] = useState("");
  const [transportadora, setTransportadora] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!plate || !motorista || !transportadora) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de registrar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/caminhoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: plate,
          motorista,
          transportadora,
        }),
      });

      if (!res.ok) throw new Error("Erro no cadastro");

      const data = await res.json();
      setGeneratedId(data.id);
      setIsSuccess(true);

      toast({
        title: "Caminhão registrado",
        description: `Placa ${plate} registrada com sucesso.`,
      });

      setTimeout(() => {
        setIsSuccess(false);
        setPlate("");
        setMotorista("");
        setTransportadora("");
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
          Registre a chegada de um novo caminhão no estacionamento
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
                <span className="text-gray-500">Data/Hora de Entrada:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
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
                <Label htmlFor="motorista">Nome do Motorista</Label>
                <Input
                  id="motorista"
                  placeholder="João da Silva"
                  value={motorista}
                  onChange={(e) => setMotorista(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="transportadora">Transportadora</Label>
                <Input
                  id="transportadora"
                  placeholder="Transportes ABC"
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  className="mt-1"
                />
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