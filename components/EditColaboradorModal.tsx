"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";

type Veiculo = {
  placa: string;
  modelo: string;
  cor: string;
};

type Props = {
  colaborador: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function EditColaboradorModal({
  colaborador,
  isOpen,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    tipoCombustivel: "Gasolina Comum",
    litrosCombustivel: "",
    veiculos: [] as Veiculo[],
  });

  useEffect(() => {
    if (isOpen && colaborador) {
      setForm({
        nome: colaborador.nome || "",
        documento: colaborador.documento || "",
        tipoCombustivel: colaborador.tipoCombustivel || "Gasolina Comum",
        litrosCombustivel: colaborador.litrosCombustivel?.toString() || "",
        veiculos: colaborador.veiculos || [],
      });
    }
  }, [isOpen, colaborador]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVeiculoChange = (index: number, field: keyof Veiculo, value: string) => {
    const novos = [...form.veiculos];
    novos[index][field] = value;
    setForm((prev) => ({ ...prev, veiculos: novos }));
  };

  const adicionarVeiculo = () => {
    setForm((prev) => ({
      ...prev,
      veiculos: [...prev.veiculos, { placa: "", modelo: "", cor: "" }],
    }));
  };

  const removerVeiculo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      veiculos: prev.veiculos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/colaboradores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: colaborador.id,
          nome: form.nome,
          documento: form.documento,
          tipoCombustivel: form.tipoCombustivel,
          litrosCombustivel: parseFloat(form.litrosCombustivel),
          veiculos: form.veiculos,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar colaborador");

      toast({ title: "Colaborador atualizado com sucesso" });
      onSave();
      setTimeout(onClose, 100);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Nome" value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} />
          <Input placeholder="Documento" value={form.documento} onChange={(e) => handleChange("documento", e.target.value)} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium">Veículos</label>
              <Button variant="ghost" size="icon" onClick={adicionarVeiculo}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {form.veiculos.map((v, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <Input
                  placeholder="Placa"
                  value={v.placa}
                  onChange={(e) => handleVeiculoChange(idx, "placa", e.target.value)}
                />
                <Input
                  placeholder="Modelo"
                  value={v.modelo}
                  onChange={(e) => handleVeiculoChange(idx, "modelo", e.target.value)}
                />
                <Input
                  placeholder="Cor"
                  value={v.cor}
                  onChange={(e) => handleVeiculoChange(idx, "cor", e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-center justify-self-end"
                  onClick={() => removerVeiculo(idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <label className="block font-medium">Tipo de combustível</label>
          <select
            value={form.tipoCombustivel}
            onChange={(e) => handleChange("tipoCombustivel", e.target.value)}
            className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none"
          >
            <option value="Gasolina Comum">Gasolina Comum</option>
            <option value="Gasolina Aditivada">Gasolina Aditivada</option>
            <option value="Etanol">Etanol</option>
            <option value="Diesel">Diesel</option>
            <option value="Diesel S10">Diesel S10</option>
          </select>

          <Input
            type="number"
            placeholder="Litros de combustível"
            value={form.litrosCombustivel}
            onChange={(e) => handleChange("litrosCombustivel", e.target.value)}
          />

          <Button className="w-full mt-2" onClick={handleSubmit}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}