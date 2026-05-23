import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

const EMPTY = { nome: '', whatsapp: '', nome_barbearia: '', cidade: '', quantidade_profissionais: '', mensagem: '' };

export default function LeadForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Campo obrigatório';
    if (!form.whatsapp.trim()) e.whatsapp = 'Campo obrigatório';
    if (!form.nome_barbearia.trim()) e.nome_barbearia = 'Campo obrigatório';
    if (!form.cidade.trim()) e.cidade = 'Campo obrigatório';
    if (!form.quantidade_profissionais) e.quantidade_profissionais = 'Selecione uma opção';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await base44.entities.Lead.create({ ...form, origem: 'landing', status: 'novo' });
    setLoading(false);
    setSuccess(true);
    setForm(EMPTY);
  };

  if (success) {
    return (
      <section id="contato" className="py-24 px-6 bg-[#F7F3EC]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(200,155,60,0.15)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#C89B3C' }} />
          </div>
          <h2 className="text-2xl font-black text-[#111111] mb-3 font-playfair">Recebemos seus dados.</h2>
          <p className="text-[#6B6258]">Em breve entraremos em contato para apresentar o Gestor Barber.</p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-6 text-sm text-[#6B6258] hover:text-[#111111] underline underline-offset-2 transition-colors"
          >
            Enviar outra solicitação
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="contato" className="py-24 px-6 bg-[#F7F3EC]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-[#111111] mb-3 font-playfair">Fale com a gente</h2>
          <p className="text-[#6B6258]">
            Quer ver como o Gestor Barber pode funcionar na sua barbearia? Preencha os dados abaixo e receba uma demonstração.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DED0] p-8 md:p-10 shadow-sm">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all"
                  style={{ borderColor: errors.nome ? '#DC2626' : '#E8DED0', background: '#FAFAF8' }}
                />
                {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">WhatsApp *</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="(62) 9 9999-9999"
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all"
                  style={{ borderColor: errors.whatsapp ? '#DC2626' : '#E8DED0', background: '#FAFAF8' }}
                />
                {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
              </div>

              {/* Nome da barbearia */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">Nome da barbearia *</label>
                <input
                  type="text"
                  value={form.nome_barbearia}
                  onChange={e => set('nome_barbearia', e.target.value)}
                  placeholder="Ex: Studio 47 Barber"
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all"
                  style={{ borderColor: errors.nome_barbearia ? '#DC2626' : '#E8DED0', background: '#FAFAF8' }}
                />
                {errors.nome_barbearia && <p className="text-xs text-red-500 mt-1">{errors.nome_barbearia}</p>}
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">Cidade *</label>
                <input
                  type="text"
                  value={form.cidade}
                  onChange={e => set('cidade', e.target.value)}
                  placeholder="Ex: Goiânia"
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all"
                  style={{ borderColor: errors.cidade ? '#DC2626' : '#E8DED0', background: '#FAFAF8' }}
                />
                {errors.cidade && <p className="text-xs text-red-500 mt-1">{errors.cidade}</p>}
              </div>

              {/* Quantidade de profissionais */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">Quantos profissionais? *</label>
                <select
                  value={form.quantidade_profissionais}
                  onChange={e => set('quantidade_profissionais', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all appearance-none"
                  style={{ borderColor: errors.quantidade_profissionais ? '#DC2626' : '#E8DED0', background: '#FAFAF8', color: form.quantidade_profissionais ? '#111111' : '#9CA3AF' }}
                >
                  <option value="" disabled>Selecione</option>
                  <option value="1">1 profissional</option>
                  <option value="2-4">2 a 4 profissionais</option>
                  <option value="5+">5 ou mais profissionais</option>
                </select>
                {errors.quantidade_profissionais && <p className="text-xs text-red-500 mt-1">{errors.quantidade_profissionais}</p>}
              </div>

              {/* Mensagem */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#6B6258] mb-1.5">Mensagem <span className="font-normal text-[#9CA3AF]">(opcional)</span></label>
                <textarea
                  value={form.mensagem}
                  onChange={e => set('mensagem', e.target.value)}
                  placeholder="Conte um pouco sobre o que você procura..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm text-[#111111] outline-none transition-all resize-none"
                  style={{ borderColor: '#E8DED0', background: '#FAFAF8' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-base transition-all disabled:opacity-60"
              style={{ background: '#C89B3C', color: '#111111' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#B8892F'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C89B3C'; }}
            >
              {loading ? 'Enviando...' : 'Quero uma demonstração'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}