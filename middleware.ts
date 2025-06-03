import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// Cria uma chave secreta para o jose
function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

const rotaParaModulo: Record<string, string> = {
  "/dashboard": "DASHBOARD",
  "/laboratorio": "LABORATORIO",
  "/historico": "HISTORICO",
  "/linhas": "LINHAS",
  "/caixas": "CAIXAS",
  "/estacionamento": "ESTACIONAMENTO",
  "/usuarios": "USUARIOS", // uso futuro
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

  const rotasPublicas = ["/login", "/api/authenticate"];
  if (rotasPublicas.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload }: any = await jwtVerify(token, getSecretKey());

    if (payload.role === "SYSADMIN") return NextResponse.next();

    const rotaProtegida = Object.keys(rotaParaModulo).find((rota) =>
      pathname.startsWith(rota)
    );

    if (!rotaProtegida) return NextResponse.next();

    const modulo = rotaParaModulo[rotaProtegida];

    if (payload.permissoes?.includes(modulo)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", req.url));
  } catch (error) {
    console.error("Erro ao verificar JWT:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};