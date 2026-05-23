import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center font-inter">
      <div className="text-center">
        <div className="text-8xl font-black text-[#1B1C1E]/10 mb-4">404</div>
        <h1 className="text-2xl font-black text-[#1B1C1E] mb-2">Página não encontrada</h1>
        <p className="text-gray-400 mb-6">A página que você procura não existe.</p>
        <Link to="/" className="px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: '#C89B3C', color: '#111111' }}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
