"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import StatusIndicator from "./status-indicator"

// Dados de exemplo para tempos médios por linha
const LINE_DATA = [
  {
    id: 1,
    name: "LINHA 1",
    averageTime: 28,
    status: "active",
    boxes: ["Caixa 01", "Caixa 02"],
    type: "Diversos",
    totalProcessed: 24,
  },
  {
    id: 2,
    name: "LINHA 2",
    averageTime: 35,
    status: "active",
    boxes: ["Caixa 03"],
    type: "Oleoso",
    totalProcessed: 18,
  },
  {
    id: 3,
    name: "LINHA 3",
    averageTime: 42,
    status: "active",
    boxes: ["Caixa 04"],
    type: "Alcalino",
    totalProcessed: 15,
  },
  {
    id: 4,
    name: "LINHA 4",
    averageTime: 31,
    status: "maintenance",
    boxes: ["Caixa 05", "Caixa 06"],
    type: "Ácidos",
    totalProcessed: 20,
  },
]

export default function LineAverageTimes() {
  const { toast } = useToast()
  const [lines, setLines] = useState(LINE_DATA)

  // Função para alternar o status de manutenção de uma linha
  const toggleMaintenanceStatus = (lineId: number, inMaintenance: boolean, reason = "") => {
    setLines(
      lines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            status: inMaintenance ? "maintenance" : "active",
            maintenanceReason: inMaintenance ? reason : undefined,
          }
        }
        return line
      }),
    )

    toast({
      title: inMaintenance ? "Linha em manutenção" : "Linha ativada",
      description: inMaintenance
        ? `A ${lines.find((l) => l.id === lineId)?.name} foi colocada em manutenção.`
        : `A ${lines.find((l) => l.id === lineId)?.name} foi reativada.`,
    })
  }

  // Determinar a cor da barra de progresso com base no tempo médio
  const getProgressColor = (time: number) => {
    if (time < 30) return "bg-green-500"
    if (time < 45) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Tempo Médio por Linha</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{line.name}</h3>
                  {line.status === "maintenance" ? (
                    <StatusIndicator status="maintenance" size="small" />
                  ) : (
                    <Badge variant="outline" className="font-medium text-sm">
                      {line.type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{line.averageTime} min</span>
                  <MaintenanceDialog
                    line={line}
                    onToggleMaintenance={(inMaintenance, reason) =>
                      toggleMaintenanceStatus(line.id, inMaintenance, reason)
                    }
                  />
                </div>
              </div>
              <Progress
                value={100}
                className={`h-2 ${line.status === "maintenance" ? "bg-purple-200" : "bg-gray-200"}`}
              >
                <div
                  className={`h-full ${
                    line.status === "maintenance" ? "bg-purple-500" : getProgressColor(line.averageTime)
                  }`}
                  style={{ width: `${Math.min((line.averageTime / 60) * 100, 100)}%` }}
                ></div>
              </Progress>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Caixas: {line.boxes.join(", ")}</span>
                <span>Total processado: {line.totalProcessed}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de diálogo para gerenciar o status de manutenção
function MaintenanceDialog({ line, onToggleMaintenance }) {
  const [open, setOpen] = useState(false)
  const [inMaintenance, setInMaintenance] = useState(line.status === "maintenance")
  const [reason, setReason] = useState(line.maintenanceReason || "")

  const handleSave = () => {
    onToggleMaintenance(inMaintenance, reason)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status da {line.name}</DialogTitle>
          <DialogDescription>Gerencie o status operacional da linha.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode" className="flex items-center gap-2">
              Modo de Manutenção
              {inMaintenance && <StatusIndicator status="maintenance" size="small" />}
            </Label>
            <Switch id="maintenance-mode" checked={inMaintenance} onCheckedChange={setInMaintenance} />
          </div>
          {inMaintenance && (
            <div className="space-y-2">
              <Label htmlFor="maintenance-reason">Motivo da Manutenção</Label>
              <textarea
                id="maintenance-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[80px] p-2 border rounded-md"
                placeholder="Descreva o motivo da manutenção..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
