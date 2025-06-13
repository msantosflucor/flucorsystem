"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import EditUserModal from "@/components/EditUserModal";

const MODULOS = [
  "DASHBOARD",
  "LABORATORIO",
  "HISTORICO",
  "ESTACIONAMENTO",
  "LINHAS",
  "CAIXAS",
  "CAMINHAO",
];

const ROLES = ["PADRAO", "QUIMICO", "SYSADMIN"];

type Usuario = {
  id: number;
  username: string;
  email?: string;
  documento?: string;
  role: string;
  permissoes: string[];
};

export default function UsuariosPage() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [role, setRole] = useState("PADRAO");
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<Usuario | null>(null);

  const router = useRouter();

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios", { credentials: "include" });
      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCheckboxChange = (modulo: string) => {
    setModulosSelecionados((prev) =>
      prev.includes(modulo)
        ? prev.filter((m) => m !== modulo)
        : [...prev, modulo]
    );
  };

  const handleCadastrar = async () => {
    setCarregando(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          senha,
          email,
          documento,
          role,
          modulos: modulosSelecionados,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar usuário.");

      toast({ title: "Usuário criado!" });
      limparFormulario();
      fetchUsuarios();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEdicao(usuario);
    setModalAberto(true);
  };

  const handleExcluir = async (id: number) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este usuário?");
    if (!confirm) return;

    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      toast({ title: "Usuário excluído" });
      fetchUsuarios();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  const limparFormulario = () => {
    setUsername("");
    setSenha("");
    setEmail("");
    setDocumento("");
    setRole("PADRAO");
    setModulosSelecionados([]);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="w-full max-w-3xl flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Voltar
        </Button>
        <Button variant="secondary" onClick={() => router.push("/auth/logs")}>
          Ver Logs de Atividade
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Cadastrar Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="RG ou CNH" value={documento} onChange={(e) => setDocumento(e.target.value)} />

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

          <Button className="w-full mt-4" onClick={handleCadastrar} disabled={carregando}>
            {carregando ? "Salvando..." : "Cadastrar"}
          </Button>
        </CardContent>
      </Card>

      <div className="w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Usuários Cadastrados</h2>
        <ul className="space-y-4">
          {usuarios.map((u) => (
            <li
              key={u.id}
              className="border rounded-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="font-semibold">
                  {u.username} ({u.role})
                </p>
                <p className="text-sm text-gray-600">
                  {u.permissoes.length ? u.permissoes.join(", ") : "Sem permissões"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEditar(u)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleExcluir(u.id)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {usuarioEdicao && (
        <EditUserModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          usuario={usuarioEdicao}
          onSave={() => {
            setModalAberto(false);
            fetchUsuarios();
          }}
        />
      )}
    </div>
  );
}