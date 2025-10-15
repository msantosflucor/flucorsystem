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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const ROLES = ["PADRAO", "QUIMICO", "SYSADMIN", "GUARITA"]; // ← Role GUARITA adicionada aqui

const MODULOS = [
  "DASHBOARD",
  "LABORATORIO",
  "HISTORICO",
  "ESTACIONAMENTO",
  "LINHAS",
  "CAIXAS",
  "CAMINHAO",
  "ACESSO",
  "POSHORARIO",
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  usuario: any;
  onSave: () => void;
};

export default function EditUserModal({ isOpen, onClose, usuario, onSave }: Props) {
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [role, setRole] = useState("PADRAO");
  const [novaSenha, setNovaSenha] = useState("");
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);

  useEffect(() => {
    if (usuario) {
      setEmail(usuario.email || "");
      setDocumento(usuario.documento || "");
      setRole(usuario.role);
      setModulosSelecionados(usuario.permissoes || []);
      setNovaSenha("");
    }
  }, [usuario]);

  const handleCheckboxChange = (modulo: string) => {
    setModulosSelecionados((prev) =>
      prev.includes(modulo)
        ? prev.filter((m) => m !== modulo)
        : [...prev, modulo]
    );
  };

  const handleSalvar = async () => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuario.id,
          username: usuario.username,
          email,
          documento,
          role,
          modulos: modulosSelecionados,
          novaSenha: novaSenha || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar alterações");

      toast({ title: "Usuário atualizado com sucesso" });
      onClose();
      onSave();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Usuário: {usuario?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Nova senha (opcional)"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="RG ou CNH"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          <div className="space-y-1">
            <Label>Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="font-semibold mb-2">Permissões:</p>
            <div className="grid grid-cols-2 gap-2">
              {MODULOS.map((modulo) => (
                <label key={modulo} className="flex items-center space-x-2">
                  <Checkbox
                    checked={modulosSelecionados.includes(modulo)}
                    onCheckedChange={() => handleCheckboxChange(modulo)}
                  />
                  <span>{modulo}</span>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full mt-2" onClick={handleSalvar}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
