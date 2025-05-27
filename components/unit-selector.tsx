"use client";

import { useEffect, useState } from "react";

interface Unidade {
  id: number;
  nome: string;
  corHex: string;
}

interface UnitSelectorProps {
  currentUnitColor: string;
  onUnitChange: (color: string) => void;
}

export default function UnitSelector({ currentUnitColor, onUnitChange }: UnitSelectorProps) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  useEffect(() => {
    async function fetchUnidades() {
      try {
        const res = await fetch("/api/unidades");
        const data = await res.json();
        setUnidades(data);
      } catch (err) {
        console.error("Erro ao buscar unidades:", err);
      }
    }

    fetchUnidades();
  }, []);

  return (
    <div className="flex gap-2">
      {unidades.map((unidade) => (
        <button
          key={unidade.id}
          onClick={() => onUnitChange(unidade.corHex)}
          className={`px-3 py-1 text-sm rounded border shadow-sm transition-colors duration-150 ${
            currentUnitColor === unidade.corHex
              ? "text-white"
              : "text-black hover:bg-gray-100"
          }`}
          style={{
            backgroundColor: currentUnitColor === unidade.corHex ? unidade.corHex : "transparent",
            borderColor: unidade.corHex,
          }}
        >
          {unidade.nome}
        </button>
      ))}
    </div>
  );
}
