"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import {
  Input,
} from "@/components/ui/input";
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

export default function AccessControl() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nomePessoa: "",
    documentoPessoa: "",
    empresaOuSetor: "",
    pessoaSolicitante: "",
    possuiVeiculo: false,
    placaVeiculo: "",
  });
  const [acessos, setAcessos] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [buscaPlaca, setBuscaPlaca] = useState("");
  const [selectedAccess, setSelectedAccess] = useState<any | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [activeTab, setActiveTab] = useState("register");
  const [dataFiltro, setDataFiltro] = useState<Date | null>(new Date());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [modalTicketPersonalizado, setModalTicketPersonalizado] = useState(false);
  const [dataInicioValidade, setDataInicioValidade] = useState<Date | null>(new Date());
  const [dataFimValidade, setDataFimValidade] = useState<Date | null>(null);

  // NEW: identifica se um item do histórico é de caminhão
  const ehCaminhao = (a: any) => Boolean(a?.caminhaoId);

  const fetchAcessos = async () => {
    try {
      const res = await fetch("/api/acessos");
      const data = await res.json();
      setAcessos(data);
    } catch (error) {
      console.error("Erro ao buscar acessos:", error);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const res = await fetch("/api/colaboradores");
      const data = await res.json();
      setColaboradores(data.colaboradores || []);
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
    }
  };

  useEffect(() => {
    fetchAcessos();
    fetchColaboradores();
    
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const role = data?.user?.role;
        setUserRole(role);
        if (role === "LOGISTICA") setActiveTab("placas");
      })
      .catch(() => setUserRole(null));
  }, []);

  const gerarRelatorioPDF = () => {
    const params = new URLSearchParams();
    if (dataFiltro) {
      params.append("data", format(dataFiltro, "yyyy-MM-dd"));
    }
    window.open(`/api/relatorios/acessos-pdf?${params.toString()}`, "_blank");
  };

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
      const res = await fetch("/api/acessos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomePessoa: form.nomePessoa,
          documentoPessoa: form.documentoPessoa,
          empresaOuSetor: form.empresaOuSetor,
          pessoaSolicitante: form.pessoaSolicitante,
          tipo: form.possuiVeiculo ? "VEICULO" : "PEDESTRE",
          placaVeiculo: form.possuiVeiculo ? form.placaVeiculo : null,
        }),
      });

      if (!res.ok) throw new Error("Falha no registro");

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
    }
  };

  // REPLACE: registrando saída decide endpoint por tipo
  const registrarSaida = async (acesso: any) => {
    try {
      let res: Response;

      if (ehCaminhao(acesso)) {
        // Caminhão → fecha pelo novo endpoint
        res = await fetch(`/api/acessos/caminhao/saida`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caminhaoId: acesso.caminhaoId }),
        });
      } else {
        // Pedestre/veículo → fluxo antigo por ID do acesso
        res = await fetch(`/api/acessos/${acesso.id}/saida`, { method: "PATCH" });
      }

      if (!res.ok) throw new Error("Erro ao registrar saída");
      toast({ title: "Saída registrada com sucesso!" });
      fetchAcessos(); // atualiza a lista
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao registrar saída.",
        variant: "destructive",
      });
    }
  };

  const abrirDetalhes = (acesso: any) => {
    setSelectedAccess(acesso);
    setModalAberto(true);
  };

  const calcularTempoTotal = (entrada: string, saida: string) => {
    const e = new Date(entrada);
    const s = new Date(saida);
    const diff = Math.floor((s.getTime() - e.getTime()) / 60000);
    return `${diff} min`;
  };

  const gerarTicketsCombustivelPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const hoje = new Date();
    const validade = new Date(hoje);
    validade.setDate(validade.getDate() + 6);
    const validadeTexto = `${hoje.toLocaleDateString("pt-BR")} até ${validade.toLocaleDateString("pt-BR")}`;
    const dataHojeStr = hoje.toLocaleDateString("pt-BR").replace(/\//g, "-");
    const horaStr = hoje.toLocaleTimeString("pt-BR").replace(/:/g, "-");

    const marginX = 10;
    const marginY = 10;
    const ticketWidth = 63;
    const ticketHeight = 90;
    const spacingX = 0.5;
    const spacingY = 0.5;
    const ticketsPerRow = 3;
    const ticketsPerPage = 9;

    let ticketCount = 0;

    colaboradoresFiltrados.forEach((colab) => {
      colab.veiculos?.forEach((veiculo: any) => {
        if (ticketCount > 0 && ticketCount % ticketsPerPage === 0) doc.addPage();

        const row = Math.floor((ticketCount % ticketsPerPage) / ticketsPerRow);
        const col = ticketCount % ticketsPerRow;

        const x = marginX + col * (ticketWidth + spacingX);
        const y = marginY + row * (ticketHeight + spacingY);

        const tipoComb = colab.tipoCombustivel?.trim()?.toUpperCase() || "NÃO ESPECIFICADO";
        const litrosComb = colab.litrosCombustivel ? `${colab.litrosCombustivel} LITROS` : "NÃO DEFINIDO";

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(x, y, ticketWidth, ticketHeight);

        const logoW = 29;
        const logoH = 10;
        const logoX = x + (ticketWidth - logoW) / 2;
        doc.addImage(logoBase64, "PNG", logoX, y + 3, logoW, logoH);

        doc.setFillColor(0, 0, 0);
        doc.rect(x, y + 14, ticketWidth, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("CUPOM DE ABASTECIMENTO", x + ticketWidth / 2, y + 19, { align: "center" });

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const camposYStart = y + 21;
        const camposYEnd = y + 48;
        const campoHeight = 5.5;
        const totalCamposAltura = 4 * campoHeight;
        let currentY = camposYStart + ((camposYEnd - camposYStart - totalCamposAltura) / 2) + 2;
        doc.text(`Nome: ${colab.nome || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Placa: ${veiculo.placa || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Veículo: ${veiculo.modelo || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Cor: ${veiculo.cor || "-"}`, x + 4, currentY); currentY += campoHeight;

        const redY = currentY + 2;
        doc.setFillColor(200, 0, 0);
        doc.rect(x, redY, ticketWidth, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`Combustível: ${tipoComb}`, x + ticketWidth / 2, redY + 5.5, { align: "center" });

        currentY = redY + 13;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Quantidade: ${litrosComb}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Válido: ${validadeTexto}`, x + 4, currentY); currentY += campoHeight;

        const linhaY = currentY + 8;
        doc.setLineWidth(0.1);
        doc.line(x + 8, linhaY, x + ticketWidth - 8, linhaY);
        doc.setFontSize(7);
        doc.text("Assinatura/Carimbo", x + ticketWidth / 2, linhaY + 3, { align: "center" });

        ticketCount++;
      });
    });

    doc.save(`tickets-combustivel-${dataHojeStr}-${horaStr}.pdf`);
  };

  const gerarTicketsPersonalizadosPDF = (dataInicio: Date, dataFim: Date) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const hoje = new Date();
    const dataHojeStr = hoje.toLocaleDateString("pt-BR").replace(/\//g, "-");
    const horaStr = hoje.toLocaleTimeString("pt-BR").replace(/:/g, "-");
    const validadeTexto = `${dataInicio.toLocaleDateString("pt-BR")} até ${dataFim.toLocaleDateString("pt-BR")}`;

    const marginX = 10;
    const marginY = 10;
    const ticketWidth = 63;
    const ticketHeight = 90;
    const spacingX = 0.5;
    const spacingY = 0.5;
    const ticketsPerRow = 3;
    const ticketsPerPage = 9;

    let ticketCount = 0;

    colaboradoresFiltrados.forEach((colab) => {
      colab.veiculos?.forEach((veiculo: any) => {
        if (ticketCount > 0 && ticketCount % ticketsPerPage === 0) doc.addPage();

        const row = Math.floor((ticketCount % ticketsPerPage) / ticketsPerRow);
        const col = ticketCount % ticketsPerRow;

        const x = marginX + col * (ticketWidth + spacingX);
        const y = marginY + row * (ticketHeight + spacingY);

        const tipoComb = colab.tipoCombustivel?.trim()?.toUpperCase() || "NÃO ESPECIFICADO";
        const litrosComb = colab.litrosCombustivel ? `${colab.litrosCombustivel} LITROS` : "NÃO DEFINIDO";

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(x, y, ticketWidth, ticketHeight);

        const logoW = 29;
        const logoH = 10;
        const logoX = x + (ticketWidth - logoW) / 2;
        doc.addImage(logoBase64, "PNG", logoX, y + 3, logoW, logoH);

        doc.setFillColor(0, 0, 0);
        doc.rect(x, y + 14, ticketWidth, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("CUPOM DE ABASTECIMENTO", x + ticketWidth / 2, y + 19, { align: "center" });

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const camposYStart = y + 21;
        const camposYEnd = y + 48;
        const campoHeight = 5.5;
        const totalCamposAltura = 4 * campoHeight;
        let currentY = camposYStart + ((camposYEnd - camposYStart - totalCamposAltura) / 2) + 2;
        doc.text(`Nome: ${colab.nome || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Placa: ${veiculo.placa || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Veículo: ${veiculo.modelo || "-"}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Cor: ${veiculo.cor || "-"}`, x + 4, currentY); currentY += campoHeight;

        const redY = currentY + 2;
        doc.setFillColor(200, 0, 0);
        doc.rect(x, redY, ticketWidth, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`Combustível: ${tipoComb}`, x + ticketWidth / 2, redY + 5.5, { align: "center" });

        currentY = redY + 13;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Quantidade: ${litrosComb}`, x + 4, currentY); currentY += campoHeight;
        doc.text(`Válido: ${validadeTexto}`, x + 4, currentY); currentY += campoHeight;

        const linhaY = currentY + 8;
        doc.setLineWidth(0.1);
        doc.line(x + 8, linhaY, x + ticketWidth - 8, linhaY);
        doc.setFontSize(7);
        doc.text("Assinatura/Carimbo", x + ticketWidth / 2, linhaY + 3, { align: "center" });

        ticketCount++;
      });
    });

    doc.save(`tickets-personalizados-${dataHojeStr}-${horaStr}.pdf`);
  };

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    const busca = buscaPlaca.toLowerCase();
    const nomeMatch = c.nome?.toLowerCase().includes(busca);
    const placaMatch = c.veiculos?.some((v: any) =>
      v.placa?.toLowerCase().includes(busca)
    );
    return nomeMatch || placaMatch;
  });

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
                <Input value={form.nomePessoa} onChange={(e) => setForm({ ...form, nomePessoa: e.target.value })} />
              </div>
              <div>
                <Label>Documento (RG ou CPF) *</Label>
                <Input value={form.documentoPessoa} onChange={(e) => setForm({ ...form, documentoPessoa: e.target.value })} />
              </div>
              <div>
                <Label>Empresa ou Setor</Label>
                <Input value={form.empresaOuSetor} onChange={(e) => setForm({ ...form, empresaOuSetor: e.target.value })} />
              </div>
              <div>
                <Label>Pessoa Solicitante (opcional)</Label>
                <Input value={form.pessoaSolicitante} onChange={(e) => setForm({ ...form, pessoaSolicitante: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={form.possuiVeiculo} onCheckedChange={(checked) => setForm({ ...form, possuiVeiculo: !!checked })} />
                <Label>Possui veículo</Label>
              </div>
              {form.possuiVeiculo && (
                <div>
                  <Label>Placa do Veículo *</Label>
                  <Input value={form.placaVeiculo} onChange={(e) => setForm({ ...form, placaVeiculo: e.target.value })} />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={registrarEntrada}>Registrar Entrada</Button>
            </CardFooter>
          </TabsContent>
        )}

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

                <Button variant="outline" onClick={gerarRelatorioPDF} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Gerar Relatório
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {acessos
                .filter((a) => {
                  if (!dataFiltro) return true;
                  const d = new Date(a.dataEntrada);
                  return d.toDateString() === dataFiltro.toDateString();
                })
                .map((a) => (
                  <div key={a.id} className="border rounded-md p-3 flex justify-between items-center">
                    <div className="space-y-1 text-sm">
                      {ehCaminhao(a) ? (
                        <>
                          <p className="font-semibold">Caminhão — Placa {a.placaVeiculo || "—"}</p>
                          {a.empresaOuSetor && (
                            <p className="text-xs text-muted-foreground">
                              Transportadora: {a.empresaOuSetor}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">{a.nomePessoa}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.documentoPessoa}
                            {a.placaVeiculo ? ` — Placa ${a.placaVeiculo}` : ""}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.dataSaida ? "secondary" : "default"}>
                        {a.dataSaida ? "Saiu" : "Na fábrica"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => abrirDetalhes(a)}>
                        <Info className="w-4 h-4" />
                      </Button>
                      {!a.dataSaida && (
                        <Button variant="outline" size="sm" onClick={() => registrarSaida(a)}>
                          Registrar Saída
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </TabsContent>
        )}

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
                  <Button variant="outline" onClick={gerarTicketsCombustivelPDF}>
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
            {colaboradoresFiltrados.length === 0 ? (
              <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
            ) : (
              colaboradoresFiltrados.map((colab) => (
                <Card key={colab.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{colab.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>Documento:</strong> {colab.documento}</p>
                    {colab.veiculos?.map((v: any, idx: number) => (
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
                              const res = await fetch("/api/acessos", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  nomePessoa: colab.nome,
                                  documentoPessoa: colab.documento,
                                  empresaOuSetor: "",
                                  pessoaSolicitante: "",
                                  tipo: colab.veiculos?.length > 0 ? "VEICULO" : "PEDESTRE",
                                  placaVeiculo: colab.veiculos?.[0]?.placa || null,
                                }),
                              });
                              if (!res.ok) throw new Error("Erro ao registrar entrada");
                              toast({ title: "Entrada registrada com sucesso!" });
                              fetchAcessos();
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

      {selectedAccess && (
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {ehCaminhao(selectedAccess) ? (
                <>
                  <p><strong>Tipo:</strong> Caminhão</p>
                  <p><strong>Placa:</strong> {selectedAccess.placaVeiculo || "—"}</p>
                  {selectedAccess.empresaOuSetor && (
                    <p><strong>Transportadora:</strong> {selectedAccess.empresaOuSetor}</p>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Nome:</strong> {selectedAccess.nomePessoa}</p>
                  <p><strong>Documento:</strong> {selectedAccess.documentoPessoa}</p>
                  {selectedAccess.placaVeiculo && (
                    <p><strong>Placa do Veículo:</strong> {selectedAccess.placaVeiculo}</p>
                  )}
                </>
              )}
              {selectedAccess.empresaOuSetor && !ehCaminhao(selectedAccess) && <p><strong>Empresa/Setor:</strong> {selectedAccess.empresaOuSetor}</p>}
              {selectedAccess.pessoaSolicitante && <p><strong>Pessoa Solicitante:</strong> {selectedAccess.pessoaSolicitante}</p>}
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