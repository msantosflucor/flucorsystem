"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Clock, AlertTriangle } from "lucide-react"

interface BoxReleaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boxData: any
  onRelease: (justification?: string) => void
}

export default function BoxReleaseDialog({ open, onOpenChange, boxData, onRelease }: BoxReleaseDialogProps) {
  const { toast } = useToast()
  const [justification, setJustification] = useState("")

  // Calcular o tempo em minutos (simulado para este exemplo)
  const elapsedTime = Number.parseInt(boxData?.time || "0")
  const requiresJustification = elapsedTime > 50

  const handleRelease = () => {
    if (requiresJustification && !justification.trim()) {
      toast({
        title: "Justificativa necessária",
        description: "Por favor, forneça uma justificativa para o tempo excedido.",
        variant: "destructive",
      })
      return
    }

    onRelease(justification)
    setJustification("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liberar {boxData?.name}</DialogTitle>
          <DialogDescription>Confirme a liberação da caixa após o descarregamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Caminhão:</span>
            <span>{boxData?.truck}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Tempo de ocupação:</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{boxData?.time}</span>
            </div>
          </div>

          {requiresJustification && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Tempo excedido</h4>
                  <p className="text-sm text-amber-700">
                    O tempo de ocupação excedeu 50 minutos. Por favor, forneça uma justificativa.
                  </p>
                </div>
              </div>

              <Label htmlFor="justification">Justificativa</Label>
              <Textarea
                id="justification"
                placeholder="Explique o motivo do tempo excedido..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleRelease}>Confirmar Liberação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
