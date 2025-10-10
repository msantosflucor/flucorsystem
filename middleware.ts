import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

const rotaParaModulo: Record<string, string> = {
  "/laboratorio": "LABORATORIO",
  "/historico": "HISTORICO",
  "/linhas": "LINHAS",
  "/caixas": "CAIXAS",
  "/estacionamento": "ESTACIONAMENTO",
  "/usuarios": "USUARIOS",
  "/acesso": "ACESSO",
  "/auth/acesso": "ACESSO",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo-flucor.jpeg") ||
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf|map)$/)
  ) {
    return NextResponse.next();
  }

  const rotasPublicas = ["/", "/login", "/api/authenticate", "/inicio", "/acesso-negado"];
  if (rotasPublicas.some((rota) => pathname === rota || pathname.startsWith(rota))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.warn(`[MIDDLEWARE] Bloqueado: sem token | Rota: ${pathname}`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload }: any = await jwtVerify(token, getSecretKey());

    if (pathname.startsWith("/auth/usuarios") && payload.role !== "SYSADMIN") {
      console.warn(`[MIDDLEWARE] Bloqueado: acesso à /auth/usuarios negado para ${payload.username}`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (payload.role === "SYSADMIN") return NextResponse.next();

    if (pathname.startsWith("/dashboard")) {
      const tab = req.nextUrl.searchParams.get("tab");
      if (!tab) {
        return NextResponse.next(); // Permite acesso ao dashboard base
      }
      if (payload.permissoes?.includes(tab.toUpperCase())) {
        return NextResponse.next();
      }
      console.warn(`[MIDDLEWARE] Bloqueado: ${payload.username} tentou acessar tab '${tab}' sem permissão.`);
      return NextResponse.redirect(new URL("/acesso-negado", req.url));
    }

    const rotaProtegida = Object.entries(rotaParaModulo).find(([prefixo]) =>
      pathname.startsWith(prefixo)
    );
    const modulo = rotaProtegida?.[1];

    if (modulo && payload.permissoes?.includes(modulo)) {
      return NextResponse.next();
    }

    console.warn(`[MIDDLEWARE] Bloqueado: ${payload.username} tentou acessar ${modulo || pathname} mas não tem permissão.`);
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  } catch (error) {
    console.error("[MIDDLEWARE] Erro ao verificar JWT:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
