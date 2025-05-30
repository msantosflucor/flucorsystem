"use client"

import { useEffect, useState } from "react"
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import {
  Clock, FlaskConical, AlertTriangle, CheckCircle2, Info,
} from "lucide-react"

export default function LaboratoryAnalysis() {
  const [caminhoes, setCaminhoes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const [tanque, setTanque] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const fetchCaminhoes = async () => {
    try {
      const res = await fetch("/api/caminhoes")
      const data = await res.json()
      setCaminhoes(data)
    } catch (err) {
      console.error("Erro ao buscar caminhões:", err)
    }
  }

  useEffect(() => {
    fetchCaminhoes()
  }, [])

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diff / 60000)
  }

  const handleSelecionar = (id: number) => {
    setSelectedId(id)
    setActiveTab("analysis")
    const selected = caminhoes.find(c => c.id === id)
    setStatus(selected?.status || "")
    setTanque("")
    setObservacoes("")
  }

  const openDetailsDialog = (id: number) => {
    setSelectedId(id)
    setDetailsDialogOpen(true)
  }

  const sample = caminhoes.find((c) => c.id === selectedId)

  const handleSubmit = async () => {
    if (!selectedId || !status || !tanque) {
      alert("Preencha todos os campos obrigatórios.")
      return
    }

    if ((status === "incompatible" || status === "rejected") && !observacoes) {
      alert("Observações obrigatórias para incompatíveis ou recusados.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/analises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caminhaoId: selectedId,
          status,
          tanque,
          observacoes,
        }),
      })

      if (!res.ok) throw new Error("Falha ao salvar")

      await fetchCaminhoes()

      setSelectedId(null)
      setStatus("")
      setTanque("")
      setObservacoes("")
      setActiveTab("pending")
    } catch (err) {
      console.error("Erro ao registrar análise:", err)
      alert("Erro ao registrar análise.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "waiting": return "Aguardando"
      case "in_progress": return "Em Análise"
      case "approved": return "Liberado"
      case "incompatible": return "Incompatível"
      case "rejected": return "Recusado"
      default: return "Indefinido"
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-50 border-yellow-300 text-yellow-700"
      case "in_progress": return "bg-blue-50 border-blue-300 text-blue-700"
      case "approved": return "bg-green-50 border-green-300 text-green-700"
      case "incompatible": return "bg-red-50 border-red-300 text-red-700"
      case "rejected": return "bg-gray-100 border-gray-300 text-gray-700"
      default: return "bg-muted"
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending">Registros</TabsTrigger>
        <TabsTrigger value="analysis" disabled={!sample}>Registrar Análise</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Registros de Caminhões
              <Badge>{caminhoes.filter(c => c.status !== "finalizado").length} registros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Placa</th>
                    <th className="text-left py-2 px-4">Origem</th>
                    <th className="text-left py-2 px-4">Caixa</th>
                    <th className="text-left py-2 px-4">Tempo</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {caminhoes
                    .filter((c) => c.status !== "finalizado")
                    .map((c) => (
                      <tr key={c.id} className="border-t hover:bg-muted/50">
                        <td className="py-2 px-4 font-mono">{c.id}</td>
                        <td className="py-2 px-4">{c.placa}</td>
                        <td className="py-2 px-4">{c.origem}</td>
                        <td className="py-2 px-4">{c.caixa?.nome || "N/A"}</td>
                        <td className="py-2 px-4 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {getTimeElapsed(c.criadoEm)} min
                        </td>
                        <td className="py-2 px-4">
                          <Badge
                            variant="outline"
                            className={statusColor(c.status)}
                          >
                            {statusLabel(c.status)}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 flex gap-2">
                          <Button size="sm" onClick={() => handleSelecionar(c.id)}>Analisar</Button>
                          <Button size="icon" variant="outline" onClick={() => openDetailsDialog(c.id)}>
                            <Info className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {caminhoes.filter((c) => c.status !== "finalizado").length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analysis">
        {sample ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Registrar Análise Laboratorial
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><strong>ID do Registro:</strong> {sample.id}</div>
                <div><strong>Placa:</strong> {sample.placa}</div>
                <div><strong>Origem:</strong> {sample.origem}</div>
                <div><strong>Caixa:</strong> {sample.caixa?.nome || "N/A"}</div>
                <div><strong>Data:</strong> {new Date(sample.criadoEm).toLocaleString("pt-BR")}</div>
                <div className="flex items-center gap-1 col-span-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Tempo de Espera:</strong> {getTimeElapsed(sample.criadoEm)} minutos</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status da Análise</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button variant={status === "approved" ? "default" : "outline"} className={status === "approved" ? "bg-green-600 text-white" : ""} onClick={() => setStatus("approved")}>Liberado</Button>
                  <Button variant={status === "in_progress" ? "default" : "outline"} className={status === "in_progress" ? "bg-yellow-500 text-white" : ""} onClick={() => setStatus("in_progress")}>Em Análise</Button>
                  <Button variant={status === "incompatible" ? "default" : "outline"} className={status === "incompatible" ? "bg-red-600 text-white" : ""} onClick={() => setStatus("incompatible")}>Incompatível</Button>
                  <Button variant={status === "rejected" ? "default" : "outline"} className={status === "rejected" ? "bg-gray-800 text-white" : ""} onClick={() => setStatus("rejected")}>Recusado</Button>
                </div>
              </div>

              <div>
                <Label>Tanque de Destino</Label>
                <Input placeholder="TQ01, TQ02, etc." value={tanque} onChange={(e) => setTanque(e.target.value)} />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea placeholder="Instruções adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} />
              </div>

              {(status === "incompatible" || status === "rejected") && !observacoes && (
                <div className="flex items-start gap-2 p-4 border border-red-300 bg-red-50 rounded-md">
                  <AlertTriangle className="text-red-600 mt-1" />
                  <p className="text-sm text-red-800">Observações obrigatórias para esse status.</p>
                </div>
              )}

              {status === "approved" && (
                <div className="flex items-start gap-2 p-4 border border-green-300 bg-green-50 rounded-md">
                  <CheckCircle2 className="text-green-600 mt-1" />
                  <p className="text-sm text-green-800">
                    A amostra será liberada para o tanque <strong>{tanque || "[não informado]"}</strong>.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("pending")}>Voltar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Análise"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <p className="text-muted-foreground">Nenhuma amostra selecionada.</p>
        )}
      </TabsContent>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>

          {sample && (
            <div className="space-y-4">
              <div><strong>ID:</strong> {sample.id}</div>
              <div><strong>Placa:</strong> {sample.placa}</div>
              <div><strong>Origem:</strong> {sample.origem}</div>
              <div><strong>Caixa:</strong> {sample.caixa?.nome || "N/A"}</div>
              <div><strong>Data:</strong> {new Date(sample.criadoEm).toLocaleString()}</div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}