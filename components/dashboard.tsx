"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Truck,
  FlaskConical,
  History,
  Settings,
  MapPin,
} from "lucide-react";
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

export default function Dashboard({ unitColor = "#8B1A1A" }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUnitColor, setCurrentUnitColor] = useState(unitColor);

  const [caminhoes, setCaminhoes] = useState([]);
  const [analisesHoje, setAnalisesHoje] = useState([]);
  const [caixas, setCaixas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch("/api/caminhoes"),
          fetch("/api/analises"),
          fetch("/api/caixas"),
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();
        const data3 = await res3.json();

        setCaminhoes(data1);
        setAnalisesHoje(data2);
        setCaixas(data3);
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
      }
    };

    fetchData();
  }, []);

  const handleUnitChange = (color: string) => {
    setCurrentUnitColor(color);
    toast({
      title: "Unidade alterada",
      description: "Você alterou para uma nova unidade.",
    });
  };

  const caminhõesAguardando = caminhoes.filter(
    (c) => !c.status || c.status === "waiting" || c.status === "in_progress"
  );

  const mediaEspera = caminhõesAguardando.length
    ? Math.floor(
        caminhõesAguardando.reduce(
          (acc, c) =>
            acc + (Date.now() - new Date(c.criadoEm).getTime()) / 60000,
          0
        ) / caminhõesAguardando.length
      )
    : 0;

  const analisesHojeTotal = analisesHoje.filter(
    (a) =>
      new Date(a.criadoEm).toDateString() === new Date().toDateString()
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
          <PendingSamplesIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast({
                title: "Relatório gerado",
                description: "O relatório foi exportado com sucesso.",
              })
            }
          >
            Exportar Relatório
          </Button>
        </div>
      </header>

      <Tabs
        defaultValue="dashboard"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <Clock className="h-5 w-5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="truck">
            <Truck className="h-5 w-5" />
            Registro de Caminhão
          </TabsTrigger>
          <TabsTrigger value="laboratory">
            <FlaskConical className="h-5 w-5" />
            Análise Laboratorial
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-5 w-5" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="lines">
            <Settings className="h-5 w-5" />
            Gerenciar Linhas
          </TabsTrigger>
          <TabsTrigger value="parking">
            <MapPin className="h-5 w-5" />
            Estacionamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Caminhões Aguardando
                </CardTitle>
                <Truck className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caminhõesAguardando.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {
                    caminhõesAguardando.filter(
                      (c) => c.status === "in_progress"
                    ).length
                  }{" "}
                  em análise,{" "}
                  {
                    caminhõesAguardando.filter(
                      (c) => !c.status || c.status === "waiting"
                    ).length
                  }{" "}
                  aguardando
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio de Espera
                </CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mediaEspera} min</div>
                <p className="text-xs text-muted-foreground">
                  baseado nos registros
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Caixas Disponíveis
                </CardTitle>
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caixasLivres}/{totalCaixas}
                </div>
                <p className="text-xs text-muted-foreground">
                  atualizando automaticamente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Análises Hoje
                </CardTitle>
                <FlaskConical className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analisesHojeTotal.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analisesLiberadas} liberadas, {analisesRecusadas} recusadas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <BoxesStatus />
            </div>
            <div className="space-y-4">
              <PendingSamplesList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="truck">
          <TruckRegistration />
        </TabsContent>
        <TabsContent value="laboratory">
          <LaboratoryAnalysis />
        </TabsContent>
        <TabsContent value="history">
          <HistoryLog />
        </TabsContent>
        <TabsContent value="lines">
          <LineManagement />
        </TabsContent>
        <TabsContent value="parking">
          <ParkingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}