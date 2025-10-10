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
import EditColaboradorModal from "@/components/EditColaboradorModal";
import FlucorLogo from "@/components/flucor-logo";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MODULOS = [
  "DASHBOARD",
  "LABORATORIO",
  "HISTORICO",
  "ESTACIONAMENTO",
  "LINHAS",
  "CAIXAS",
  "CAMINHAO",
  "ACESSO",
];

const ROLES = ["PADRAO", "QUIMICO", "SYSADMIN", "GUARITA", "LOGISTICA"];

type Usuario = {
  id: number;
  username: string;
  email?: string;
  documento?: string;
  role: string;
  permissoes: string[];
};

type Veiculo = {
  placa: string;
  modelo: string;
  cor: string;
};

type Colaborador = {
  id: number;
  nome: string;
  documento: string;
  tipoCombustivel: string;
  litrosCombustivel: number;
  veiculos: Veiculo[];
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

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [modalColaborador, setModalColaborador] = useState(false);
  const [colaboradorEdicao, setColaboradorEdicao] = useState<Colaborador | null>(null);
  const [novoColaborador, setNovoColaborador] = useState({
    nome: "",
    documento: "",
    tipoCombustivel: "Gasolina Comum",
    litrosCombustivel: "",
    placa: "",
    modelo: "",
    cor: "",
  });

  const router = useRouter();

  useEffect(() => {
    fetchUsuarios();
    fetchColaboradores();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios", { credentials: "include" });
      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message });
    }
  };

  const fetchColaboradores = async () => {
    try {
      const res = await fetch("/api/colaboradores", { credentials: "include" });
      const data = await res.json();
      setColaboradores(data.colaboradores);
    } catch (error: any) {
      toast({ title: "Erro ao carregar colaboradores", description: error.message });
    }
  };

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

  const handleCadastrarColaborador = async () => {
    try {
      const res = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoColaborador.nome,
          documento: novoColaborador.documento,
          tipoCombustivel: novoColaborador.tipoCombustivel,
          litrosCombustivel: parseFloat(novoColaborador.litrosCombustivel),
          veiculos: [
            {
              placa: novoColaborador.placa,
              modelo: novoColaborador.modelo,
              cor: novoColaborador.cor,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("Erro ao cadastrar colaborador.");
      toast({ title: "Colaborador cadastrado com sucesso!" });
      setNovoColaborador({ 
        nome: "", 
        documento: "", 
        placa: "", 
        modelo: "", 
        cor: "",
        tipoCombustivel: "Gasolina Comum",
        litrosCombustivel: ""
      });
      setModalColaborador(false);
      fetchColaboradores();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message });
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEdicao(usuario);
    setModalAberto(true);
  };

  const handleEditarColaborador = (colaborador: Colaborador) => {
    setColaboradorEdicao(colaborador);
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

  const handleExcluirColaborador = async (id: number) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este colaborador?");
    if (!confirm) return;
    try {
      const res = await fetch(`/api/colaboradores?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir colaborador");
      toast({ title: "Colaborador excluído" });
      fetchColaboradores();
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
    <div className="container mx-auto py-6">
      <header className="mb-6 flex items-center justify-between">
        <FlucorLogo size="medium" unitColor="#8B1A1A" />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>← Voltar</Button>
          <Button variant="secondary" onClick={() => router.push("/auth/logs")}>Ver Logs de Atividade</Button>
        </div>
      </header>

      <Tabs defaultValue="placas">
        <TabsList className="mb-6">
          {typeof window !== "undefined" && localStorage.getItem("role") !== "LOGISTICA" && (
            <TabsTrigger value="usuarios">Cadastrar Usuário</TabsTrigger>
          )}
          <TabsTrigger value="placas">Placas Cadastradas</TabsTrigger>
        </TabsList>

        {typeof window !== "undefined" && localStorage.getItem("role") !== "LOGISTICA" && (
          <TabsContent value="usuarios">
            <div className="flex flex-col items-center gap-6 py-4">
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
            </div>
          </TabsContent>
        )}

        <TabsContent value="placas">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setModalColaborador(true)}>Cadastrar Novo Colaborador</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {colaboradores.map((c) => (
              <Card key={c.id} className="p-3 text-sm w-full h-full">
                <CardHeader>
                  <CardTitle>{c.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-600">
                  <p><strong>Documento:</strong> {c.documento}</p>
                  <p><strong>Combustível:</strong> {c.tipoCombustivel}</p>
                  <p><strong>Litros:</strong> {c.litrosCombustivel}</p>
                  {c.veiculos.map((v, idx) => (
                    <div key={idx} className="text-sm text-gray-600 border-t pt-1 mt-1">
                      <p><strong>Placa:</strong> {v.placa}</p>
                      <p><strong>Modelo:</strong> {v.modelo}</p>
                      <p><strong>Cor:</strong> {v.cor}</p>
                    </div>
                  ))}
                </CardContent>
                <div className="flex gap-2 p-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditarColaborador(c)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleExcluirColaborador(c.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de edição de usuário */}
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

      {/* Modal de edição de colaborador */}
      <EditColaboradorModal
        colaborador={colaboradorEdicao}
        isOpen={!!colaboradorEdicao}
        onClose={() => {
          setColaboradorEdicao(null);
        }}
        onSave={() => {
          fetchColaboradores();
          setColaboradorEdicao(null);
        }}
      />

      {/* Modal de novo colaborador */}
      <Dialog open={modalColaborador} onOpenChange={setModalColaborador}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Nome completo" value={novoColaborador.nome} onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })} />
            <Input placeholder="Documento" value={novoColaborador.documento} onChange={(e) => setNovoColaborador({ ...novoColaborador, documento: e.target.value })} />
            <Input placeholder="Placa" value={novoColaborador.placa} onChange={(e) => setNovoColaborador({ ...novoColaborador, placa: e.target.value })} />
            <Input placeholder="Modelo do veículo" value={novoColaborador.modelo} onChange={(e) => setNovoColaborador({ ...novoColaborador, modelo: e.target.value })} />
            <Input placeholder="Cor do veículo" value={novoColaborador.cor} onChange={(e) => setNovoColaborador({ ...novoColaborador, cor: e.target.value })} />
            
            <Select
              value={novoColaborador.tipoCombustivel}
              onValueChange={(value) =>
                setNovoColaborador({ ...novoColaborador, tipoCombustivel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasolina Comum">Gasolina Comum</SelectItem>
                <SelectItem value="Gasolina Aditivada">Gasolina Aditivada</SelectItem>
                <SelectItem value="Etanol">Etanol</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Diesel S10">Diesel S10</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Litros de combustível"
              value={novoColaborador.litrosCombustivel}
              onChange={(e) =>
                setNovoColaborador({
                  ...novoColaborador,
                  litrosCombustivel: e.target.value,
                })
              }
            />

            <Button onClick={handleCadastrarColaborador} className="w-full mt-4">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}