"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

const MODULOS = [
  "DASHBOARD",
  "LABORATORIO",
  "HISTORICO",
  "ESTACIONAMENTO",
  "LINHAS",
  "CAIXAS",
];

type Usuario = {
  id: number;
  username: string;
  role: string;
  permissoes: string[];
};

export default function UsuariosPage() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<number | null>(null);

  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha ao buscar usuários.");

      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role?.toUpperCase() !== "SYSADMIN") {
      router.push("/dashboard");
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          senha,
          modulos: modulosSelecionados,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar usuário.");

      toast({ title: "Usuário criado!" });
      setUsername("");
      setSenha("");
      setModulosSelecionados([]);
      fetchUsuarios();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setModoEdicao(usuario.id);
    setUsername(usuario.username);
    setSenha("");
    setModulosSelecionados(usuario.permissoes);
  };

  const handleSalvarEdicao = async () => {
    if (!modoEdicao) return;
    setCarregando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: modoEdicao,
          modulos: modulosSelecionados,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar edição");

      toast({ title: "Permissões atualizadas" });
      setModoEdicao(null);
      setUsername("");
      setSenha("");
      setModulosSelecionados([]);
      fetchUsuarios();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleExcluir = async (id: number) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este usuário?");
    if (!confirm) return;

    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      toast({ title: "Usuário excluído" });
      fetchUsuarios();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="w-full max-w-md">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          ← Voltar
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {modoEdicao ? "Editar Permissões" : "Cadastrar Usuário"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={modoEdicao !== null}
          />
          {!modoEdicao && (
            <Input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          )}
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
          <Button
            className="w-full mt-4"
            onClick={modoEdicao ? handleSalvarEdicao : handleCadastrar}
            disabled={carregando}
          >
            {carregando
              ? "Salvando..."
              : modoEdicao
              ? "Salvar Permissões"
              : "Cadastrar"}
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
                <p className="font-semibold">{u.username} ({u.role})</p>
                <p className="text-sm text-gray-600">
                  {u.permissoes.length
                    ? u.permissoes.join(", ")
                    : "Sem permissões"}
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
    </div>
  );
}