export default function AcessoNegado() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Acesso Negado</h1>
      <p className="text-gray-700 text-base max-w-md">
        Sua conta está ativa, mas não possui permissão para acessar nenhum dos módulos do sistema.
        <br />
        Entre em contato com um administrador para obter acesso.
      </p>
    </div>
  );
}