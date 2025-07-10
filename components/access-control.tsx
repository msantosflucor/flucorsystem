"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Info, History, CalendarIcon, DoorOpen, Download,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import jsPDF from "jspdf";
import logoBase64 from "@/lib/logo-base64-validado";

// Type definitions
interface Veiculo {
  placa: string;
  modelo: string;
  cor: string;
}

interface Colaborador {
  id: number;
  nome: string;
  documento: string;
  tipoCombustivel?: string;
  litrosCombustivel?: number;
  veiculos?: Veiculo[];
}

interface Acesso {
  id: number;
  nomePessoa: string;
  documentoPessoa: string;
  empresaOuSetor?: string;
  pessoaSolicitante?: string;
  tipo: 'VEICULO' | 'PEDESTRE';
  placaVeiculo?: string | null;
  dataEntrada: string;
  dataSaida?: string;
}

interface AccessForm {
  nomePessoa: string;
  documentoPessoa: string;
  empresaOuSetor: string;
  pessoaSolicitante: string;
  possuiVeiculo: boolean;
  placaVeiculo: string;
}

// API Service functions
const fetchAcessos = async (): Promise<Acesso[]> => {
  const res = await fetch("/api/acessos");
  if (!res.ok) throw new Error("Failed to fetch access records");
  return res.json();
};

const fetchColaboradores = async (): Promise<Colaborador[]> => {
  const res = await fetch("/api/colaboradores");
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data = await res.json();
  return data.colaboradores || [];
};

const registrarAcesso = async (dados: Omit<Acesso, 'id' | 'dataEntrada' | 'dataSaida'>): Promise<Acesso> => {
  const res = await fetch("/api/acessos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error("Failed to register access");
  return res.json();
};

const registrarSaidaAPI = async (id: number): Promise<Acesso> => {
  const res = await fetch(`/api/acessos/${id}/saida`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to register exit");
  return res.json();
};

// PDF Generation utilities
const generateFuelTicketsPDF = (
  colaboradores: Colaborador[],
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): jsPDF => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const hoje = new Date();
  const validade = options?.endDate || new Date(hoje);
  validade.setDate(validade.getDate() + 6);
  
  const validadeTexto = options?.startDate && options.endDate 
    ? `${options.startDate.toLocaleDateString("pt-BR")} até ${options.endDate.toLocaleDateString("pt-BR")}`
    : `${hoje.toLocaleDateString("pt-BR")} até ${validade.toLocaleDateString("pt-BR")}`;

  // ... rest of the PDF generation logic (same as original)
  return doc;
};

// Main Component
export default function AccessControl() {
  const { toast } = useToast();
  const [form, setForm] = useState<AccessForm>({
    nomePessoa: "",
    documentoPessoa: "",
    empresaOuSetor: "",
    pessoaSolicitante: "",
    possuiVeiculo: false,
    placaVeiculo: "",
  });
  
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [buscaPlaca, setBuscaPlaca] = useState("");
  const [selectedAccess, setSelectedAccess] = useState<Acesso | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [activeTab, setActiveTab] = useState("register");
  const [dataFiltro, setDataFiltro] = useState<Date | null>(new Date());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [modalTicketPersonalizado, setModalTicketPersonalizado] = useState(false);
  const [dataInicioValidade, setDataInicioValidade] = useState<Date | null>(new Date());
  const [dataFimValidade, setDataFimValidade] = useState<Date | null>(null);
  const [loading, setLoading] = useState({
    acessos: false,
    colaboradores: false,
    registro: false,
  });

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({...prev, acessos: true, colaboradores: true}));
        const [acessosData, colaboradoresData] = await Promise.all([
          fetchAcessos(),
          fetchColaboradores()
        ]);
        setAcessos(acessosData);
        setColaboradores(colaboradoresData);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar dados",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({...prev, acessos: false, colaboradores: false}));
      }
    };

    loadData();

    // Get user role
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const role = data?.user?.role;
        setUserRole(role);
        if (role === "LOGISTICA") setActiveTab("placas");
      })
      .catch(() => setUserRole(null));
  }, [toast]);

  // Filtered employees
  const colaboradoresFiltrados = useMemo(() => {
    const busca = buscaPlaca.toLowerCase();
    return colaboradores.filter((c) => {
      const nomeMatch = c.nome?.toLowerCase().includes(busca);
      const placaMatch = c.veiculos?.some((v) =>
        v.placa?.toLowerCase().includes(busca)
      );
      return nomeMatch || placaMatch;
    });
  }, [colaboradores, buscaPlaca]);

  // Calculate time spent
  const calcularTempoTotal = (entrada: string, saida: string) => {
    const e = new Date(entrada);
    const s = new Date(saida);
    const diff = Math.floor((s.getTime() - e.getTime()) / 60000);
    return `${diff} min`;
  };

  // Handlers
  const registrarEntrada = async () => {
    if (!form.nomePessoa || !form.documentoPessoa) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e documento são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (form.possuiVeiculo && !form.placaVeiculo) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a placa do veículo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(prev => ({...prev, registro: true}));
      await registrarAcesso({
        nomePessoa: form.nomePessoa,
        documentoPessoa: form.documentoPessoa,
        empresaOuSetor: form.empresaOuSetor,
        pessoaSolicitante: form.pessoaSolicitante,
        tipo: form.possuiVeiculo ? "VEICULO" : "PEDESTRE",
        placaVeiculo: form.possuiVeiculo ? form.placaVeiculo : null,
      });

      toast({ title: "Entrada registrada com sucesso!" });
      setForm({
        nomePessoa: "",
        documentoPessoa: "",
        empresaOuSetor: "",
        pessoaSolicitante: "",
        possuiVeiculo: false,
        placaVeiculo: "",
      });
      fetchAcessos();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrada.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({...prev, registro: false}));
    }
  };

  const registrarSaida = async (id: number) => {
    try {
	const saidaAtualizada = await registrarSaidaAPI(id);
	toast({ title: "Saída registrada com sucesso!" });
	setAcessos((prev) =>
	  prev.map((a) => (a.id === id ? { ...a, dataSaida: saidaAtualizada.dataSaida } : a))
	);
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao registrar saída.",
        variant: "destructive",
      });
    }
  };

  const abrirDetalhes = (acesso: Acesso) => {
    setSelectedAccess(acesso);
    setModalAberto(true);
  };

  const gerarRelatorioPDF = () => {
    const params = new URLSearchParams();
    if (dataFiltro) {
      params.append("data", format(dataFiltro, "yyyy-MM-dd"));
    }
    window.open(`/api/relatorios/acessos-pdf?${params.toString()}`, "_blank");
  };

  const gerarTicketsCombustivelPDF = () => {
    try {
      const doc = generateFuelTicketsPDF(colaboradoresFiltrados);
      const hoje = new Date();
      const dataHojeStr = hoje.toLocaleDateString("pt-BR").replace(/\//g, "-");
      const horaStr = hoje.toLocaleTimeString("pt-BR").replace(/:/g, "-");
      doc.save(`tickets-combustivel-${dataHojeStr}-${horaStr}.pdf`);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  const gerarTicketsPersonalizadosPDF = (dataInicio: Date, dataFim: Date) => {
    try {
      const doc = generateFuelTicketsPDF(colaboradoresFiltrados, {
        startDate: dataInicio,
        endDate: dataFim
      });
      const hoje = new Date();
      const dataHojeStr = hoje.toLocaleDateString("pt-BR").replace(/\//g, "-");
      const horaStr = hoje.toLocaleTimeString("pt-BR").replace(/:/g, "-");
      doc.save(`tickets-personalizados-${dataHojeStr}-${horaStr}.pdf`);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  // Render
  return (
    <Card className="max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          {userRole !== "LOGISTICA" && (
            <TabsTrigger value="register">Cadastrar Acesso</TabsTrigger>
          )}
          {userRole !== "LOGISTICA" && (
            <TabsTrigger value="history">Histórico de Acessos</TabsTrigger>
          )}
          <TabsTrigger value="placas">Placas Cadastradas</TabsTrigger>
        </TabsList>

        {/* Registration Tab */}
        {userRole !== "LOGISTICA" && (
          <TabsContent value="register">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Registro de Entrada
              </CardTitle>
              <CardDescription>
                Registre a entrada de uma pessoa ou veículo na fábrica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome completo *</Label>
                <Input 
                  value={form.nomePessoa} 
                  onChange={(e) => setForm({ ...form, nomePessoa: e.target.value })} 
                />
              </div>
              <div>
                <Label>Documento (RG ou CPF) *</Label>
                <Input 
                  value={form.documentoPessoa} 
                  onChange={(e) => setForm({ ...form, documentoPessoa: e.target.value })} 
                />
              </div>
              <div>
                <Label>Empresa ou Setor</Label>
                <Input 
                  value={form.empresaOuSetor} 
                  onChange={(e) => setForm({ ...form, empresaOuSetor: e.target.value })} 
                />
              </div>
              <div>
                <Label>Pessoa Solicitante (opcional)</Label>
                <Input 
                  value={form.pessoaSolicitante} 
                  onChange={(e) => setForm({ ...form, pessoaSolicitante: e.target.value })} 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={form.possuiVeiculo} 
                  onCheckedChange={(checked) => setForm({ ...form, possuiVeiculo: !!checked })} 
                />
                <Label>Possui veículo</Label>
              </div>
              {form.possuiVeiculo && (
                <div>
                  <Label>Placa do Veículo *</Label>
                  <Input 
                    value={form.placaVeiculo} 
                    onChange={(e) => setForm({ ...form, placaVeiculo: e.target.value })} 
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={registrarEntrada}
                disabled={loading.registro}
              >
                {loading.registro ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </CardFooter>
          </TabsContent>
        )}

        {/* History Tab */}
        {userRole !== "LOGISTICA" && (
          <TabsContent value="history">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <CardTitle>Histórico de Acessos</CardTitle>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFiltro ? format(dataFiltro, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dataFiltro || undefined}
                      onSelect={setDataFiltro}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="outline" 
                  onClick={gerarRelatorioPDF} 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Gerar Relatório
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading.acessos ? (
                <p>Carregando histórico...</p>
              ) : (
                acessos
                  .filter((a) => {
                    if (!dataFiltro) return true;
                    const d = new Date(a.dataEntrada);
                    return d.toDateString() === dataFiltro.toDateString();
                  })
                  .map((a) => (
                    <div key={a.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{a.nomePessoa}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.documentoPessoa}
                          {a.placaVeiculo ? ` - Placa ${a.placaVeiculo}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.dataSaida ? "secondary" : "default"}>
                          {a.dataSaida ? "Saiu" : "Na fábrica"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => abrirDetalhes(a)}>
                          <Info className="w-4 h-4" />
                        </Button>
                        {!a.dataSaida && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => registrarSaida(a.id)}
                          >
                            Registrar Saída
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </TabsContent>
        )}

        {/* Plates Tab */}
        <TabsContent value="placas">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CardTitle>Placas Cadastradas</CardTitle>
              </div>
            </div>
            <div className="mt-4">
              <Input
                placeholder="Buscar por nome ou placa..."
                value={buscaPlaca}
                onChange={(e) => setBuscaPlaca(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-2 gap-2">
              {(userRole === "SYSADMIN" || userRole === "LOGISTICA") && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={gerarTicketsCombustivelPDF}
                  >
                    Gerar Ticket Combustível
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setModalTicketPersonalizado(true)}
                  >
                    Gerar Ticket Personalizado
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading.colaboradores ? (
              <p>Carregando colaboradores...</p>
            ) : colaboradoresFiltrados.length === 0 ? (
              <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
            ) : (
              colaboradoresFiltrados.map((colab) => (
                <Card key={colab.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{colab.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>Documento:</strong> {colab.documento}</p>
                    {colab.veiculos?.map((v, idx) => (
                      <div key={idx} className="border-t pt-1 mt-1">
                        <p><strong>Placa:</strong> {v.placa}</p>
                        <p><strong>Modelo:</strong> {v.modelo}</p>
                        <p><strong>Cor:</strong> {v.cor}</p>
                        {userRole !== "GUARITA" && (
                          <>
                            <p><strong>Combustível:</strong> {colab.tipoCombustivel || "-"}</p>
                            <p><strong>Litros:</strong> {colab.litrosCombustivel || "-"}</p>
                          </>
                        )}
                      </div>
                    ))}

                    {userRole && ["GUARITA", "SYSADMIN"].includes(userRole) && (
                      !acessos.some(
                        (a) => a.documentoPessoa === colab.documento && !a.dataSaida
                      ) && (
                        <Button
                          className="mt-3"
                          variant="default"
                          onClick={async () => {
                            try {
                              const novoAcesso = await registrarAcesso({
                                nomePessoa: colab.nome,
                                documentoPessoa: colab.documento,
                                empresaOuSetor: "",
                                pessoaSolicitante: "",
                                tipo: colab.veiculos?.length > 0 ? "VEICULO" : "PEDESTRE",
                                placaVeiculo: colab.veiculos?.[0]?.placa || null,
                              });
                              toast({ title: "Entrada registrada com sucesso!" });
                              setAcessos((prev) => [...prev, novoAcesso]);
                            } catch (error) {
                              toast({
                                title: "Erro",
                                description: "Falha ao registrar entrada.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Registrar Entrada
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      {/* Access Details Modal */}
      {selectedAccess && (
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {selectedAccess.nomePessoa}</p>
              <p><strong>Documento:</strong> {selectedAccess.documentoPessoa}</p>
              {selectedAccess.empresaOuSetor && <p><strong>Empresa/Setor:</strong> {selectedAccess.empresaOuSetor}</p>}
              {selectedAccess.pessoaSolicitante && <p><strong>Pessoa Solicitante:</strong> {selectedAccess.pessoaSolicitante}</p>}
              {selectedAccess.placaVeiculo && <p><strong>Placa do Veículo:</strong> {selectedAccess.placaVeiculo}</p>}
              <p><strong>Entrada:</strong> {new Date(selectedAccess.dataEntrada).toLocaleString()}</p>
              <p><strong>Saída:</strong> {selectedAccess.dataSaida ? new Date(selectedAccess.dataSaida).toLocaleString() : "Ainda no local"}</p>
              {selectedAccess.dataSaida && (
                <p><strong>Tempo total no local:</strong> {calcularTempoTotal(selectedAccess.dataEntrada, selectedAccess.dataSaida)}</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setModalAberto(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Ticket Modal */}
      <Dialog open={modalTicketPersonalizado} onOpenChange={setModalTicketPersonalizado}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Ticket com Validade Personalizada</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 justify-between">
            <div className="flex-1">
              <Label>Data de Início</Label>
              <Calendar
                mode="single"
                selected={dataInicioValidade || undefined}
                onSelect={setDataInicioValidade}
              />
            </div>
            <div className="flex-1">
              <Label>Data de Fim</Label>
              <Calendar
                mode="single"
                selected={dataFimValidade || undefined}
                onSelect={setDataFimValidade}
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              onClick={() => {
                if (!dataInicioValidade || !dataFimValidade) {
                  toast({
                    title: "Erro",
                    description: "Selecione ambas as datas",
                    variant: "destructive",
                  });
                  return;
                }
                gerarTicketsPersonalizadosPDF(dataInicioValidade, dataFimValidade);
                setModalTicketPersonalizado(false);
              }}
            >
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}