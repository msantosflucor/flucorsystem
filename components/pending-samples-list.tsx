"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Truck, AlertTriangle } from "lucide-react"
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

export default function PendingSamplesList() {
  // Ordenar amostras por tempo decorrido (mais antigas primeiro)
  const sortedSamples = [...PENDING_SAMPLES].sort((a, b) => b.elapsedTime - a.elapsedTime)

  if (sortedSamples.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amostras Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">Não há amostras ativas no momento.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amostras Ativas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSamples.map((sample) => (
            <div
              key={sample.id}
              className={`p-3 rounded-md border ${
                sample.elapsedTime > 30 ? "border-red-200 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{sample.id}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Truck className="h-3.5 w-3.5" />
                    <span>{sample.plate}</span>
                  </div>
                </div>
                <StatusIndicator status={sample.status} size="small" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm">{sample.box}</div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    sample.elapsedTime > 30 ? "text-red-600 font-medium" : "text-gray-600"
                  }`}
                >
                  {sample.elapsedTime > 30 && <AlertTriangle className="h-3.5 w-3.5" />}
                  <Clock className="h-3.5 w-3.5" />
                  <span>{sample.elapsedTime} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
