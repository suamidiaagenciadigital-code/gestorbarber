import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Pencil, Trash2, Play, Bell, Megaphone, ArrowLeft, Eye, EyeOff, GripVertical } from 'lucide-react';

const TYPE_CONFIG = {
  tutorial: { label: 'Tutorial', icon: Play, color: 'bg-blue-100 text-blue-700' },
  notice:   { label: 'Aviso',    icon: Bell, color: 'bg-yellow-100 text-yellow-700' },
  ad:       { label: 'Publicidade', icon: Megaphone, color: 'bg-purple-100 text-purple-700' },
};

const CATEGORIES = [
  'agenda', 'clientes', 'servicos', 'profissionais',
  'financeiro', 'ai-growth', 'configuracoes', 'geral',
];

const EMPTY = {
  type: 'tutorial', title: '', description: '', url: '',
  image_url: '', category: 'agenda', duration: '2 min',
  sort_order: 0, active: true, starts_at: '', ends_at: '',
};

export default function MasterConteudo() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('tutorial'); // 'tutorial' | 'notice' | 'ad'
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-items'],
    queryFn: () => base44.entities.ContentItem.list('-sort_order', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentItem.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-items'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentItem.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-items'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-items'] }),
  });

  const toggleActive = (item) =>
    updateMutation.mutate({ id: item.id, data: { active: !item.active } });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      type: item.type, title: item.title, description: item.description || '',
      url: item.url || '', image_url: item.image_url || '',
      category: item.category || 'agenda', duration: item.duration || '2 min',
      sort_order: item.sort_order || 0, active: item.active,
      starts_at: item.starts_at ? item.starts_at.slice(0, 16) : '',
      ends_at: item.ends_at ? item.ends_at.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const openNew = () => { setForm({ ...EMPTY, type: tab }); setShowForm(true); };

  const handleSave = () => {
    const payload = {
      ...form,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const filtered = items.filter(i => i.type === tab);

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      {/* Header */}
      <header className="bg-[#111111] text-white px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C' }}>GB</span>
          </div>
          <div>
            <div className="font-bold">Gestor Barber — Master</div>
            <div className="text-xs text-white/60">Central de Conteúdo</div>
          </div>
        </div>
        <Link to="/master" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>
      </header>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1B1C1E]">Central de Conteúdo</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie tutoriais, avisos e publicidades exibidos no painel das barbearias</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-[#C89B3C] text-[#111111] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#B8892F] transition-colors">
            <Plus className="w-4 h-4" />Novo item
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-black/8 rounded-xl p-1 mb-6 w-fit">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-[#111111]'}`}>
              <cfg.icon className="w-3.5 h-3.5" />{cfg.label}s
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-[#1B3A4B]/20 border-t-[#1B3A4B] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/8 p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">{tab === 'tutorial' ? '🎬' : tab === 'notice' ? '🔔' : '📢'}</div>
            <p className="text-sm mb-3">Nenhum {TYPE_CONFIG[tab].label.toLowerCase()} cadastrado</p>
            <button onClick={openNew} className="text-sm font-semibold text-[#1B3A4B] hover:underline">
              Criar primeiro →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id}
                className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-all ${item.active ? 'border-black/8' : 'border-black/5 opacity-60'}`}>
                {/* Drag handle placeholder */}
                <GripVertical className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_CONFIG[item.type]?.color || 'bg-gray-100'}`}>
                  {item.type === 'tutorial' && <Play className="w-4 h-4" />}
                  {item.type === 'notice' && <Bell className="w-4 h-4" />}
                  {item.type === 'ad' && <Megaphone className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-[#1B1C1E] text-sm">{item.title}</span>
                    {item.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.category}</span>
                    )}
                    {item.duration && (
                      <span className="text-xs text-gray-400">{item.duration}</span>
                    )}
                    {!item.active && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inativo</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mb-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#1B3A4B] hover:underline truncate block max-w-xs">{item.url}</a>
                  )}
                  {(item.starts_at || item.ends_at) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.starts_at ? `De: ${new Date(item.starts_at).toLocaleDateString('pt-BR')}` : ''}
                      {item.ends_at ? ` até ${new Date(item.ends_at).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(item)}
                    title={item.active ? 'Desativar' : 'Ativar'}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    {item.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => { if (confirm('Excluir este item?')) deleteMutation.mutate(item.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/8 flex items-center justify-between">
              <h3 className="font-bold text-[#1B1C1E]">{editing ? 'Editar' : 'Novo'} {TYPE_CONFIG[form.type]?.label}</h3>
              <button onClick={closeForm}><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Type */}
              {!editing && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tipo</label>
                  <div className="flex gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button key={key} type="button" onClick={() => setForm(p => ({ ...p, type: key }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${form.type === key ? 'border-[#1B3A4B] bg-[#1B3A4B] text-white' : 'border-black/10 text-gray-500 hover:border-[#1B3A4B]'}`}>
                        <cfg.icon className="w-3 h-3" />{cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Como criar um agendamento"
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Texto opcional de apoio"
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none resize-none" />
              </div>

              {/* URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  {form.type === 'tutorial' ? 'URL do vídeo (YouTube, Loom, Vimeo)' : form.type === 'ad' ? 'Link de destino' : 'Link (opcional)'}
                </label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  placeholder={form.type === 'tutorial' ? 'https://loom.com/share/...' : 'https://...'}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
              </div>

              {/* Image URL (for ads) */}
              {form.type === 'ad' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">URL da imagem do banner</label>
                  <input type="url" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  {form.image_url && (
                    <img src={form.image_url} alt="preview" className="mt-2 h-20 rounded-lg object-cover border border-black/10" />
                  )}
                </div>
              )}

              {/* Category + Duration (for tutorials) */}
              {form.type === 'tutorial' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Categoria</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Duração</label>
                    <input type="text" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                      placeholder="2 min"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                </div>
              )}

              {/* Date range (for notices) */}
              {form.type === 'notice' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Exibir a partir de</label>
                    <input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Exibir até</label>
                    <input type="datetime-local" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                </div>
              )}

              {/* Sort order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ordem (maior = primeiro)</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: +e.target.value }))}
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                      className="w-4 h-4 accent-[#1B3A4B]" />
                    <span className="text-sm font-medium text-[#1B1C1E]">Ativo (visível para clientes)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/8 flex gap-3">
              <button onClick={closeForm} className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={!form.title || createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-[#1B3A4B] text-white rounded-xl text-sm font-semibold hover:bg-[#1B3A4B]/90 disabled:opacity-50">
                {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
