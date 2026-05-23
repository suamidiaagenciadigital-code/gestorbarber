export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center font-inter">
      <div className="bg-white rounded-2xl border border-black/8 p-8 max-w-sm w-full text-center shadow-sm">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-black text-[#1B1C1E] text-xl mb-2">Acesso não autorizado</h2>
        <p className="text-gray-400 text-sm">
          Sua conta não está vinculada a nenhuma barbearia.
          Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}
