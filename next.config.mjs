/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// Configura o middleware para proteger as rotas abaixo
export const config = {
  matcher: [
    "/dashboard",
    "/laboratorio",
    "/historico",
    "/linhas",
    "/caixas",
    "/estacionamento",
    "/usuarios",
    "/api/usuarios",
  ],
};