"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import StatusIndicator from "@/components/status-indicator"

// Dados de exemplo para amostras pendentes
const PENDING_SAMPLES = [
  {
    id: "ABC12345",
    plate: "ABC-1234",
    box: "Caixa 01",
    status: "pending",
    elapsedTime: 15,
  },
  {
    id: "DEF67890",
    plate: "DEF-5678",
    box: "Caixa 03",
    status: "in_progress",
    elapsedTime: 30,
  },
  {
    id: "GHI12345",
    plate: "GHI-9012",
    box: "Caixa 06",
    status: "approved",
    elapsedTime: 45,
  },
]

export default function PendingSamplesIndicator() {
  // Filtrar amostras ativas
  const activeSamples = PENDING_SAMPLES.filter(
    (sample) => sample.status === "pending" || sample.status === "in_progress" || sample.status === "approved",
  )

  // Verificar se há amostras com tempo de espera longo (mais de 30 minutos)
  const longWaitingSamples = PENDING_SAMPLES.filter(
    (sample) => (sample.status === "pending" || sample.status === "in_progress") && sample.elapsedTime > 30,
  )

  if (activeSamples.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1.5 py-1.5">
        <StatusIndicator status="pending" size="small" showLabel={false} className="mr-1" />
        <span>
          {activeSamples.length} {activeSamples.length === 1 ? "amostra ativa" : "amostras ativas"}
        </span>
      </Badge>

      {longWaitingSamples.length > 0 && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {longWaitingSamples.length} {longWaitingSamples.length === 1 ? "atraso" : "atrasos"}
          </span>
        </Badge>
      )}
    </div>
  )
}
