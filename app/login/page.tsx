"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: usuario, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha no login.");
      }

      // ✅ Salva role e permissoes no localStorage
      localStorage.setItem("role", data.usuario.role);
      localStorage.setItem("permissoes", JSON.stringify(data.usuario.permissoes));
      localStorage.setItem("token", data.token || ""); // se estiver usando token também

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.usuario.username}`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <Image
          src="/logo-flucor.jpeg"
          alt="Logo Flucor"
          width={100}
          height={100}
          className="mx-auto mb-6 rounded-md"
        />
        <h1 className="text-3xl font-bold mb-6 text-gray-800">FLUCOR</h1>

        <Card className="w-[350px] mx-auto shadow-lg">
          <CardHeader />
          <CardContent className="space-y-4">
            <Input
              placeholder="Usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
            />
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}