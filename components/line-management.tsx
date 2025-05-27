"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Truck, Clock, BarChart3 } from "lucide-react"
import StatusIndicator from "@/components/status-indicator"

interface Linha {
  id: number
  nome: string
  tipo: string
  status: "active" | "maintenance"
  caixas: string[]
  tempoMedio: number
  totalProcessado: number
  eficiencia: number
  ultimaManutencao: string
  motivoManutencao: string | null
  cargaAtual: number
}

export default function LineManagement() {
  const { toast } = useToast()

  const [lines, setLines] = useState<Linha[]>([])
  const [selectedLine, setSelectedLine] = useState<Linha | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inMaintenance, setInMaintenance] = useState(false)
  const [reason, setReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("nome")

  useEffect(() => {
    fetch("/api/linhas")
      .then((res) => res.json())
      .then((data) => setLines(data))
      .catch((error) => console.error("Erro ao carregar linhas:", error))
  }, [])

  const filteredLines = lines
    .filter((line) => {
      const matchesSearch =
        line.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.tipo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && line.status === "active") ||
        (statusFilter === "maintenance" && line.status === "maintenance")
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "nome") return a.nome.localeCompare(b.nome)
      if (sortBy === "tempo") return a.tempoMedio - b.tempoMedio
      if (sortBy === "eficiencia") return b.eficiencia - a.eficiencia
      if (sortBy === "carga") return b.cargaAtual - a.cargaAtual
      return 0
    })

  const openLineDialog = (line: Linha) => {
    setSelectedLine(line)
    setInMaintenance(line.status === "maintenance")
    setReason(line.motivoManutencao || "")
    setDialogOpen(true)
  }

  const toggleMaintenanceStatus = async (lineId: number, inMaintenance: boolean, motivo = "") => {
    try {
      const res = await fetch("/api/linhas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lineId,
          status: inMaintenance ? "maintenance" : "active",
          motivoManutencao: inMaintenance ? motivo : "",
        }),
      })

      if (!res.ok) throw new Error("Falha na atualização")

      const updatedLine = await res.json()

      setLines((prev) => prev.map((line) => (line.id === lineId ? updatedLine : line)))

      toast({
        title: inMaintenance ? "Linha em manutenção" : "Linha ativada",
        description: `${updatedLine.nome} foi ${inMaintenance ? "colocada em manutenção" : "reativada"}.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      })
    }
  }

  const handleSaveChanges = () => {
    if (inMaintenance && !reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, forneça um motivo para manutenção.",
        variant: "destructive",
      })
      return
    }

    if (selectedLine) {
      toggleMaintenanceStatus(selectedLine.id, inMaintenance, reason)
      setDialogOpen(false)
    }
  }

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return "bg-green-500"
    if (value >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getLoadColor = (value: number) => {
    if (value < 30) return "bg-blue-500"
    if (value < 70) return "bg-green-500"
    return "bg-yellow-500"
  }

  const totalLines = lines.length
  const activeLines = lines.filter((line) => line.status === "active").length
  const maintenanceLines = lines.filter((line) => line.status === "maintenance").length
  const averageEfficiency = totalLines > 0
    ? Math.round(lines.reduce((acc, l) => acc + l.eficiencia, 0) / totalLines)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Linhas</h2>
          <p className="text-muted-foreground">Controle e monitoramento das linhas operacionais.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              toast({
                title: "Relatório exportado",
                description: "Relatório de linhas gerado com sucesso.",
              })
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total de Linhas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalLines}</CardContent></Card>
        <Card><CardHeader><CardTitle>Linhas Ativas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{activeLines}</CardContent></Card>
        <Card><CardHeader><CardTitle>Em Manutenção</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{maintenanceLines}</CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Eficiência Média</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={averageEfficiency} className="w-full">
                <div
                  className={`h-full ${getEfficiencyColor(averageEfficiency)}`}
                  style={{ width: `${averageEfficiency}%` }}
                />
              </Progress>
              <span className="font-bold">{averageEfficiency}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar linha..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="maintenance">Manutenção</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nome">Nome</SelectItem>
            <SelectItem value="tempo">Tempo Médio</SelectItem>
            <SelectItem value="eficiencia">Eficiência</SelectItem>
            <SelectItem value="carga">Carga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de linhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLines.map((line) => (
          <Card key={line.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                {line.nome}
                {line.status === "maintenance" ? (
                  <StatusIndicator status="maintenance" size="small" />
                ) : (
                  <StatusIndicator status="approved" size="small" />
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => openLineDialog(line)}>
                <Settings className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">Tipo: {line.tipo}</div>
              <div className="text-sm">Caixas: {line.caixas.join(", ")}</div>
              <div className="text-sm flex items-center gap-1"><Clock className="h-4 w-4" />Tempo Médio: {line.tempoMedio} min</div>
              <div className="text-sm flex items-center gap-1"><Truck className="h-4 w-4" />Processados: {line.totalProcessado}</div>
              <div className="text-sm">
                Eficiência:
                <Progress value={line.eficiencia} className="h-2 mt-1">
                  <div
                    className={`h-full ${getEfficiencyColor(line.eficiencia)}`}
                    style={{ width: `${line.eficiencia}%` }}
                  />
                </Progress>
              </div>
              {line.status === "active" ? (
                <div className="text-sm">
                  Carga:
                  <Progress value={line.cargaAtual} className="h-2 mt-1">
                    <div
                      className={`h-full ${getLoadColor(line.cargaAtual)}`}
                      style={{ width: `${line.cargaAtual}%` }}
                    />
                  </Progress>
                </div>
              ) : (
                line.motivoManutencao && (
                  <div className="text-sm bg-purple-50 border border-purple-200 p-2 rounded-md">
                    <strong>Manutenção:</strong> {line.motivoManutencao}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar {selectedLine?.nome}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Modo de Manutenção</Label>
                <Switch checked={inMaintenance} onCheckedChange={setInMaintenance} />
              </div>
              {inMaintenance && (
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="detalhes" className="space-y-2">
              <div>Tipo: {selectedLine?.tipo}</div>
              <div>Caixas: {selectedLine?.caixas.join(", ")}</div>
              <div>Eficiência: {selectedLine?.eficiencia}%</div>
              <div>Tempo Médio: {selectedLine?.tempoMedio} min</div>
              <div>Processados: {selectedLine?.totalProcessado}</div>
              <div>Última Manutenção: {new Date(selectedLine?.ultimaManutencao ?? "").toLocaleDateString()}</div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveChanges}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}