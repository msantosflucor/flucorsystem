"use client";

import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { withPermission } from "@/components/with-permission";
import FlucorLogo from "@/components/flucor-logo";
import UnitSelector from "@/components/unit-selector";
import { Button } from "@/components/ui/button";
import LineManagement from "@/components/line-management";
import { useToast } from "@/hooks/use-toast";

const LinhasPage = () => {
  const { toast } = useToast();
  const [unitColor, setUnitColor] = useState("#8B1A1A");

  useEffect(() => {
    const storedColor = localStorage.getItem("unitColor");
    if (storedColor) setUnitColor(storedColor);
  }, []);

  const handleUnitChange = (color: string) => {
    setUnitColor(color);
    localStorage.setItem("unitColor", color);
    toast({
      title: "Unidade alterada",
      description: "Você alterou para uma nova unidade.",
    });
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("permissoes");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className="container mx-auto py-6">
      <header className="mb-6 flex items-center justify-between">
        <FlucorLogo size="medium" unitColor={unitColor} />
        <div className="flex items-center gap-2">
          <UnitSelector
            currentUnitColor={unitColor}
            onUnitChange={handleUnitChange}
          />
          {typeof window !== "undefined" &&
            localStorage.getItem("role")?.toLowerCase() === "sysadmin" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => (window.location.href = "/auth/usuarios")}
              >
                Cadastrar Usuário
              </Button>
            )}
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <LineManagement />
    </div>
  );
};

export default withPermission(LinhasPage, "LINHAS");