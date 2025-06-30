"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logoBase64 } from "@/lib/logo-base64-validado";

type Log = {
  id: number;
  usuario: string | null;
  acao: string;
  contexto: string | null; // ✅ corrigido aqui
  criadoEm: string;
};

export default function UserLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [filtrados, setFiltrados] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/usuarios/logs", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setLogs(data.logs))
      .catch((err) =>
        toast({ title: "Erro ao carregar logs", description: err.message })
      );
  }, []);

  useEffect(() => {
    const filtrado = logs.filter((log) => {
      const texto = filtroTexto.toLowerCase();
      const textoMatch =
        (log.usuario ?? "desconhecido").toLowerCase().includes(texto) ||
        log.acao.toLowerCase().includes(texto) ||
        (log.contexto ?? "").toLowerCase().includes(texto);

      const dataMatch = dataSelecionada
        ? format(new Date(log.criadoEm), "yyyy-MM-dd") ===
          format(dataSelecionada, "yyyy-MM-dd")
        : true;

      return textoMatch && dataMatch;
    });

    setFiltrados(filtrado);
  }, [filtroTexto, dataSelecionada, logs]);

  const exportarPDF = () => {
    const doc = new jsPDF();

    try {
      doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
    } catch (err) {
      console.warn("❌ Erro ao carregar o logo no PDF:", err);
    }

    doc.setFontSize(16);
    doc.text("Relatório de Logs de Usuários", 10, 45);

    let filtros: string[] = [];
    if (filtroTexto) filtros.push(`Busca: "${filtroTexto}"`);
    if (dataSelecionada) filtros.push(`Data: ${format(dataSelecionada, "dd/MM/yyyy")}`);
    if (filtros.length > 0) {
      doc.setFontSize(10);
      doc.text(`Filtros: ${filtros.join(" | ")}`, 10, 52);
    }

    autoTable(doc, {
      startY: filtros.length > 0 ? 57 : 52,
      head: [["Usuário", "Ação", "Módulo", "Data"]],
      body: filtrados.map((log) => [
        log.usuario ?? "Desconhecido",
        log.acao,
        log.contexto ?? "—", // ✅ aqui também
        format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm"),
      ]),
      styles: { fontSize: 10 },
    });

    doc.save("logs_usuarios.pdf");
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Usuários</CardTitle>
          <p className="text-sm text-muted-foreground">
            Histórico de ações realizadas pelos usuários no sistema
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <Input
                placeholder="Usuário, ação ou módulo"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>
            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataSelecionada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataSelecionada
                      ? format(dataSelecionada, "dd/MM/yyyy")
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={setDataSelecionada}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={exportarPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Usuário</th>
                  <th className="text-left py-2 px-3">Ação</th>
                  <th className="text-left py-2 px-3">Módulo</th>
                  <th className="text-left py-2 px-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">{log.usuario ?? "Desconhecido"}</td>
                    <td className="py-2 px-3">{log.acao}</td>
                    <td className="py-2 px-3">{log.contexto ?? "—"}</td> {/* ✅ aqui estava errado */}
                    <td className="py-2 px-3">
                      {format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhum log encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}