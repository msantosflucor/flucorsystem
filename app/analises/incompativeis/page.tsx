"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, FlaskConical } from "lucide-react";

export default function AnalisesIncompativeisPage() {
  const [analises, setAnalises] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const role = data?.user?.role;
        setUserRole(role);

        if (role !== "SYSADMIN" && role !== "QUIMICO") {
          router.push("/");
        } else {
          carregarAnalises();
        }
      })
      .catch(() => router.push("/"));
  }, []);

  const carregarAnalises = () => {
    fetch("/api/analises/incompativeis", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAnalises(data))
      .catch(() => toast({ title: "Erro ao carregar análises" }));
  };

  const handleLiberar = async (id: number) => {
    const res = await fetch(`/api/analises/${id}/liberar-incompativel`, {
      method: "PATCH",
      credentials: "include",
    });

    if (res.ok) {
      toast({ title: "Amostra liberada com sucesso!" });
      setAnalises(prev => prev.filter(a => a.id !== id));
    } else {
      toast({ title: "Erro ao liberar amostra" });
    }
  };

  const handleRejeitar = async (id: number) => {
    const res = await fetch(`/api/analises/${id}/rejeitar`, {
      method: "PATCH",
      credentials: "include",
    });

    if (res.ok) {
      toast({ title: "Amostra rejeitada" });
      setAnalises(prev => prev.filter(a => a.id !== id));
    } else {
      toast({ title: "Erro ao rejeitar amostra" });
    }
  };

  if (!userRole) return null;

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="w-full max-w-3xl flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Voltar
        </Button>
        <div />
      </div>

      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <FlaskConical className="text-yellow-600" /> Análises Incompatíveis
        </h1>

        {analises.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma análise incompatível pendente.</p>
        ) : (
          <ul className="space-y-4">
            {analises.map((analise) => (
              <Card key={analise.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {analise.caminhao.placa}
                    <Badge variant="destructive">Incompatível</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>Transportadora:</strong> {analise.caminhao.transportadora}</p>
                  <p><strong>Horário da coleta:</strong> {analise.caminhao.horaColeta ? new Date(analise.caminhao.horaColeta).toLocaleString("pt-BR") : "N/A"}</p>
                  <p><strong>Tanque:</strong> {analise.tanque}</p>
                  <p><strong>Observações:</strong> {analise.observacoes}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={() => handleLiberar(analise.id)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Liberar
                  </Button>
                  <Button onClick={() => handleRejeitar(analise.id)} className="bg-black text-white hover:bg-gray-800">
                    <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}