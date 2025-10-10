"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import StatusIndicator from "@/components/status-indicator";

export default function PendingSamplesIndicator() {
  const [caminhoes, setCaminhoes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/caminhoes");
        const data = await res.json();
        setCaminhoes(data);
      } catch (error) {
        console.error("Erro ao buscar caminhões:", error);
      }
    };

    fetchData();
  }, []);

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const activeSamples = caminhoes.filter(
    (c) => c.status === "waiting" || c.status === "in_progress"
  );

  const longWaitingSamples = activeSamples.filter(
    (c) => getTimeElapsed(c.criadoEm) > 30
  );

  if (activeSamples.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1.5 py-1.5"
      >
        <StatusIndicator
          status="pending"
          size="small"
          showLabel={false}
          className="mr-1"
        />
        <span>
          {activeSamples.length}{" "}
          {activeSamples.length === 1 ? "amostra ativa" : "amostras ativas"}
        </span>
      </Badge>

      {longWaitingSamples.length > 0 && (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1.5 py-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {longWaitingSamples.length}{" "}
            {longWaitingSamples.length === 1 ? "atraso" : "atrasos"}
          </span>
        </Badge>
      )}
    </div>
  );
}