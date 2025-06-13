"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Log = {
  id: number;
  usuario: string | null;
  acao: string;
  modulo: string;
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
        log.modulo.toLowerCase().includes(texto);

      const dataMatch = dataSelecionada
        ? format(new Date(log.criadoEm), "yyyy-MM-dd") ===
          format(dataSelecionada, "yyyy-MM-dd")
        : true;

      return textoMatch && dataMatch;
    });

    setFiltrados(filtrado);
  }, [filtroTexto, dataSelecionada, logs]);

  const exportarCSV = () => {
    const linhas = [
      ["Usuário", "Ação", "Módulo", "Data"],
      ...filtrados.map((log) => [
        log.usuario ?? "Desconhecido",
        log.acao,
        log.modulo,
        format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm"),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      linhas.map((linha) => linha.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "logs_usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <CardTitle>Logs de Usuários</CardTitle>
            <p className="text-sm text-muted-foreground">
              Histórico de ações realizadas pelos usuários no sistema
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
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
                      "w-[180px] justify-start text-left font-normal",
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
              <Button onClick={exportarCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
                    <td className="py-2 px-3">{log.modulo}</td>
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