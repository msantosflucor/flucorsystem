"use client";

import React, { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Clock,
  Truck,
  FlaskConical,
  History,
  Settings,
  MapPin,
  LogOut,
  Moon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import BoxesStatus from "@/components/boxes-status";
import TruckRegistration from "@/components/truck-registration";
import LaboratoryAnalysis from "@/components/laboratory-analysis";
import HistoryLog from "@/components/history-log";
import { useToast } from "@/hooks/use-toast";
import PendingSamplesIndicator from "@/components/pending-samples-indicator";
import PendingSamplesList from "@/components/pending-samples-list";
import FlucorLogo from "@/components/flucor-logo";
import LineManagement from "@/components/line-management";
import UnitSelector from "@/components/unit-selector";
import ParkingDashboard from "@/components/parking-dashboard";
import { Button } from "@/components/ui/button";
import AccessControl from "@/components/access-control";
import PosHorario from "./poshorario"; // ← IMPORT CORRIGIDO

export default function Dashboard({ unitColor = "#8B1A1A" }) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUnitColor, setCurrentUnitColor] = useState(unitColor);
  const [caminhoes, setCaminhoes] = useState([]);
  const [analisesHoje, setAnalisesHoje] = useState([]);
  const [caixas, setCaixas] = useState([]);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [res1, res2, res3] = await Promise.all([
        fetch("/api/caminhoes"),
        fetch("/api/analises"),
        fetch("/api/caixas"),
      ]);

      if (!res1.ok || !res2.ok || !res3.ok) {
        throw new Error("Erro ao buscar dados.");
      }

      const data1 = await res1.json();
      const data2 = await res2.json();
      const data3 = await res3.json();

      setCaminhoes([...data1]);
      setAnalisesHoje([...data2]);
      setCaixas([...data3]);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      toast({
        title: "Erro ao carregar dados",
        description:
          "Ocorreu um erro ao buscar dados. Verifique sua conexão ou tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPermissoes = JSON.parse(localStorage.getItem("permissoes") || "[]");
      const storedRole = localStorage.getItem("role");

      setPermissoes(storedPermissoes);
      setUserRole(storedRole);

      const tab = searchParams.get("tab");
      if (tab && storedPermissoes.includes(tab.toUpperCase())) {
        setActiveTab(tab);
      } else if (storedPermissoes.length > 0) {
        // Define a primeira aba que o usuário tem acesso
        const primeiraPermissao = storedPermissoes[0].toLowerCase();
        setActiveTab(primeiraPermissao);
        router.replace(`/dashboard?tab=${primeiraPermissao}`);
      }
    }

    fetchData();
  }, []);

  const handleUnitChange = (color: string) => {
    setCurrentUnitColor(color);
    toast({
      title: "Unidade alterada",
      description: "Você alterou para uma nova unidade.",
    });
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("permissoes");
    localStorage.removeItem("role");
    router.push("/login");
  };

  const exportarRelatorioDashboard = async () => {
    try {
      const response = await fetch("/api/relatorios/dashboard-pdf");
      if (!response.ok) {
        throw new Error("Falha ao gerar o PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório gerado",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (err) {
      console.error("Erro ao exportar relatório:", err);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    }
  };

  const caminhoesAguardando = caminhoes.filter(
    (c) => !c.status || c.status === "waiting" || c.status === "in_progress"
  );

  const mediaEspera = caminhoesAguardando.length
    ? Math.floor(
        caminhoesAguardando.reduce(
          (acc, c) =>
            acc + (Date.now() - new Date(c.criadoEm).getTime()) / 60000,
          0
        ) / caminhoesAguardando.length
      )
    : 0;

  const analisesHojeTotal = analisesHoje.filter(
    (a) => new Date(a.criadoEm).toDateString() === new Date().toDateString()
  );

  const analisesLiberadas = analisesHojeTotal.filter(
    (a) => a.status === "approved"
  ).length;
  const analisesRecusadas = analisesHojeTotal.filter(
    (a) => a.status === "rejected"
  ).length;

  const totalCaixas = caixas.length;
  const caixasLivres = caixas.filter((c) => c.status === "livre").length;

  return (
    <div className="container mx-auto py-6">
      <header className="mb-6 flex items-center justify-between">
        <FlucorLogo size="medium" unitColor={currentUnitColor} />
        <div className="flex items-center gap-2">
          <UnitSelector
            currentUnitColor={currentUnitColor}
            onUnitChange={handleUnitChange}
          />
          {!["GUARITA", "LOGISTICA"].includes(userRole || "") && (
            <PendingSamplesIndicator />
          )}
          {!["GUARITA", "LOGISTICA"].includes(userRole || "") && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportarRelatorioDashboard}
            >
              Exportar Relatório
            </Button>
          )}
          {typeof window !== "undefined" &&
            ["sysadmin", "logistica"].includes(localStorage.getItem("role")?.toLowerCase() || "") && (
              <Button
                variant="default"
                size="sm"
                onClick={() => (window.location.href = "/auth/usuarios")}
              >
                Cadastrar Usuário
              </Button>
            )}
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="flex justify-start gap-4 border-b w-full mb-4">
          {permissoes.includes("DASHBOARD") && (
            <TabsTrigger value="dashboard">
              <Clock className="h-5 w-5" />
              Dashboard
            </TabsTrigger>
          )}
          {permissoes.includes("CAMINHAO") && (
            <TabsTrigger value="truck">
              <Truck className="h-5 w-5" />
              Registro de Caminhão
            </TabsTrigger>
          )}
          {permissoes.includes("LABORATORIO") && (
            <TabsTrigger value="laboratory">
              <FlaskConical className="h-5 w-5" />
              Análise Laboratorial
            </TabsTrigger>
          )}
          {permissoes.includes("HISTORICO") && (
            <TabsTrigger value="history">
              <History className="h-5 w-5" />
              Histórico
            </TabsTrigger>
          )}
          {permissoes.includes("LINHAS") && (
            <TabsTrigger value="lines">
              <Settings className="h-5 w-5" />
              Gerenciar Linhas
            </TabsTrigger>
          )}
          {permissoes.includes("ESTACIONAMENTO") && (
            <TabsTrigger value="parking">
              <MapPin className="h-5 w-5" />
              Estacionamento
            </TabsTrigger>
          )}
          {permissoes.includes("ACESSO") && (
            <TabsTrigger value="acesso">
              <Clock className="h-5 w-5" />
              Controle de Acesso
            </TabsTrigger>
          )}
          {permissoes.includes("POSHORARIO") && (
            <TabsTrigger value="poshorario">
              <Moon className="h-5 w-5" />
              Pós-Horário
            </TabsTrigger>
          )}
        </TabsList>

        {permissoes.includes("DASHBOARD") && (
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* ... cards ... */}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <BoxesStatus caixas={caixas} onAtualizarCaixas={fetchData} />
              </div>
              <div className="space-y-4">
                <PendingSamplesList />
              </div>
            </div>
          </TabsContent>
        )}

        {permissoes.includes("CAMINHAO") && (
          <TabsContent value="truck">
            <TruckRegistration />
          </TabsContent>
        )}

        {permissoes.includes("LABORATORIO") && (
          <TabsContent value="laboratory">
            <LaboratoryAnalysis />
          </TabsContent>
        )}

        {permissoes.includes("HISTORICO") && (
          <TabsContent value="history">
            <HistoryLog onAtualizarEstacionamento={fetchData} />
          </TabsContent>
        )}

        {permissoes.includes("LINHAS") && (
          <TabsContent value="lines">
            <LineManagement />
          </TabsContent>
        )}

        {permissoes.includes("ESTACIONAMENTO") && (
          <TabsContent value="parking">
            <ParkingDashboard onAtualizarCaixas={fetchData} />
          </TabsContent>
        )}

        {permissoes.includes("ACESSO") && (
          <TabsContent value="acesso">
            <AccessControl />
          </TabsContent>
        )}

        {permissoes.includes("POSHORARIO") && (
          <TabsContent value="poshorario">
            <PosHorario /> {/* ← AGORA DEVE FUNCIONAR */}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}