import { cn } from "@/lib/utils"

type StatusType = "approved" | "in_progress" | "incompatible" | "rejected" | "free" | "pending" | "maintenance"

interface StatusIndicatorProps {
  status: StatusType
  size?: "small" | "medium" | "large"
  showLabel?: boolean
  className?: string
}

export default function StatusIndicator({
  status,
  size = "medium",
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  // Definir tamanhos com base no parâmetro
  const sizes = {
    small: "h-3 w-3",
    medium: "h-5 w-5",
    large: "h-7 w-7",
  }

  // Cores e gradientes para cada status
  const statusStyles = {
    approved: {
      bg: "bg-gradient-to-r from-green-500 to-green-600",
      border: "border-green-700",
      shadow: "shadow-md shadow-green-200",
      pulse: "animate-pulse-subtle",
      text: "text-green-700",
      label: "LIBERADO",
    },
    in_progress: {
      bg: "bg-gradient-to-r from-yellow-400 to-yellow-500",
      border: "border-yellow-600",
      shadow: "shadow-md shadow-yellow-200",
      pulse: "animate-pulse",
      text: "text-yellow-700",
      label: "EM ANÁLISE",
    },
    incompatible: {
      bg: "bg-gradient-to-r from-red-500 to-red-600",
      border: "border-red-700",
      shadow: "shadow-md shadow-red-200",
      pulse: "animate-pulse-subtle",
      text: "text-red-700",
      label: "INCOMPATIBILIDADE",
    },
    rejected: {
      bg: "bg-gradient-to-r from-gray-800 to-black",
      border: "border-gray-900",
      shadow: "shadow-md shadow-gray-400",
      pulse: "animate-pulse-subtle",
      text: "text-gray-900",
      label: "RECUSADA",
    },
    free: {
      bg: "bg-gradient-to-r from-gray-200 to-gray-300",
      border: "border-gray-400",
      shadow: "shadow-sm shadow-gray-200",
      pulse: "",
      text: "text-gray-600",
      label: "LIVRE",
    },
    pending: {
      bg: "bg-gradient-to-r from-blue-400 to-blue-500",
      border: "border-blue-600",
      shadow: "shadow-md shadow-blue-200",
      pulse: "animate-pulse",
      text: "text-blue-700",
      label: "PENDENTE",
    },
    maintenance: {
      bg: "bg-gradient-to-r from-purple-500 to-purple-600",
      border: "border-purple-700",
      shadow: "shadow-md shadow-purple-200",
      pulse: "animate-pulse-subtle",
      text: "text-purple-700",
      label: "MANUTENÇÃO",
    },
  }

  const currentStyle = statusStyles[status]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border",
          sizes[size],
          currentStyle.bg,
          currentStyle.border,
          currentStyle.shadow,
          currentStyle.pulse,
        )}
      >
        {/* Reflexo */}
        <div className="h-1/3 w-1/3 rounded-full bg-white/30 ml-1 mt-1"></div>
      </div>
      {showLabel && <span className={cn("font-medium", currentStyle.text)}>{currentStyle.label}</span>}
    </div>
  )
}
