"use client"

import Image from "next/image"

export default function FlucorLogo({
  size = "medium",
}: { size?: "small" | "medium" | "large" }) {
  const sizes = {
    small: { width: 40, height: 40 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 },
  }

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-flucor.jpeg" // novo nome sem espaços
        alt="Logo Flucor"
        width={sizes[size].width}
        height={sizes[size].height}
        priority
      />
      <div>
        <h1 className="font-bold text-2xl tracking-tight text-gray-900">FLUCOR</h1>
        <p className="text-sm text-gray-500">Tratamento de Efluentes</p>
      </div>
    </div>
  )
}