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

  // ✅ ROTA "/" ESTÁ LIBERADA
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
      console.warn(
        `[MIDDLEWARE] Bloqueado: acesso à /auth/usuarios negado para ${payload.username}`
      );
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (payload.role === "SYSADMIN") return NextResponse.next();

    const rotaProtegida = Object.keys(rotaParaModulo).find((rota) =>
      pathname.startsWith(rota)
    );

    if (!rotaProtegida) return NextResponse.next();

    const modulo = rotaParaModulo[rotaProtegida];

    if (payload.permissoes?.includes(modulo)) {
      return NextResponse.next();
    }

    console.warn(
      `[MIDDLEWARE] Bloqueado: ${payload.username} tentou acessar ${modulo} mas não tem permissão.`
    );
    return NextResponse.redirect(new URL("/login", req.url));
  } catch (error) {
    console.error("[MIDDLEWARE] Erro ao verificar JWT:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};