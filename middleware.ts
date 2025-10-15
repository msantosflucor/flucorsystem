import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no ambiente");
}

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

const rotaParaModulo: Record<string, string> = {
  "/laboratorio": "LABORATORIO",
  "/historico": "HISTORICO", 
  "/linhas": "LINHAS",
  "/caixas": "CAIXAS",
  "/estacionamento": "ESTACIONAMENTO",
  "/acesso": "ACESSO",
  "/auth/acesso": "ACESSO",
  "/poshorario": "POSHORARIO",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas - permitir acesso sem verificação
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo-flucor.jpeg") ||
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf|map)$/) ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/authenticate") ||
    pathname === "/inicio" ||
    pathname === "/acesso-negado"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.warn(`[MIDDLEWARE] Bloqueado: sem token | Rota: ${pathname}`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload }: any = await jwtVerify(token, getSecretKey());

    // DEBUG: Log para verificar o payload do token
    console.log(`[MIDDLEWARE] Usuário: ${payload.username}, Role: ${payload.role}, Permissões:`, payload.permissoes);

    // SYSADMIN tem acesso total a tudo
    if (payload.role === "SYSADMIN") {
      console.log(`[MIDDLEWARE] SYSADMIN ${payload.username} permitido acesso total a ${pathname}`);
      return NextResponse.next();
    }

    // Verificação específica para /auth/usuarios - apenas SYSADMIN
    if (pathname.startsWith("/auth/usuarios")) {
      console.warn(`[MIDDLEWARE] Bloqueado: acesso à /auth/usuarios negado para ${payload.username}`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Dashboard - verificar permissões da tab
    if (pathname.startsWith("/dashboard")) {
      const tab = req.nextUrl.searchParams.get("tab");
      if (!tab) {
        // Dashboard sem tab específica - permitir acesso
        return NextResponse.next();
      }
      
      const tabUpper = tab.toUpperCase();
      if (payload.permissoes?.includes(tabUpper)) {
        return NextResponse.next();
      }
      
      console.warn(`[MIDDLEWARE] Bloqueado: ${payload.username} tentou acessar tab '${tab}' sem permissão. Permissões:`, payload.permissoes);
      return NextResponse.redirect(new URL("/acesso-negado", req.url));
    }

    // Verificar outras rotas protegidas
    const rotaProtegida = Object.entries(rotaParaModulo).find(([prefixo]) =>
      pathname.startsWith(prefixo)
    );
    
    const modulo = rotaProtegida?.[1];

    if (modulo) {
      if (payload.permissoes?.includes(modulo)) {
        return NextResponse.next();
      }
      console.warn(`[MIDDLEWARE] Bloqueado: ${payload.username} tentou acessar ${modulo} mas não tem permissão. Permissões:`, payload.permissoes);
      return NextResponse.redirect(new URL("/acesso-negado", req.url));
    }

    // Se chegou aqui e não é rota pública nem protegida, permitir acesso
    // (pode ser uma rota nova ou que não precisa de verificação específica)
    return NextResponse.next();

  } catch (error) {
    console.error("[MIDDLEWARE] Erro ao verificar JWT:", error);
    // Limpar cookie inválido
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};