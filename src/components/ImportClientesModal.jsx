import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, X, CheckCircle, AlertCircle, Users, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Modelo de arquivo para download
const TEMPLATE_ROWS = [
  ['Nome', 'Telefone', 'Email', 'Observacoes'],
  ['João Silva', '11999991234', 'joao@email.com', 'Cliente antigo, prefere tarde'],
  ['Maria Santos', '11988887654', '', 'Alérgica a produtos com amônia'],
  ['Carlos Oliveira', '11977776543', 'carlos@gmail.com', ''],
];

// Remove acentos e deixa minúsculo para comparação de cabeçalhos
function norm(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Localiza o índice de uma coluna pelos possíveis nomes
function findCol(headers, ...keys) {
  const nh = headers.map(norm);
  for (const key of keys) {
    const idx = nh.findIndex(h => h === key || h.startsWith(key));
    if (idx >= 0) return idx;
  }
  return -1;
}

// Converte uma linha do arquivo em objeto cliente
function parseRow(row, headers) {
  const iNome  = findCol(headers, 'nome', 'name', 'cliente', 'customer');
  const iPhone = findCol(headers, 'telefone', 'celular', 'fone', 'phone', 'whatsapp', 'contato');
  const iEmail = findCol(headers, 'email', 'e-mail');
  const iObs   = findCol(headers, 'observacao', 'obs', 'notas', 'notes', 'descricao', 'anotacao');

  const get = (idx) => (idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '');

  return {
    name:  get(iNome),
    phone: get(iPhone).replace(/\s/g, ''),
    email: get(iEmail),
    notes: get(iObs),
  };
}

export default function ImportClientesModal({ companyId, existingPhones, onClose, onImported }) {
  const [step, setStep] = useState(1);        // 1: instruções  2: prévia  3: resultado
  const [rows, setRows]       = useState([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [importing, setImporting]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [result, setResult]         = useState(null);
  const fileRef = useRef(null);

  // ── Download do modelo ─────────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
    ws['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 28 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'modelo-importacao-clientes.xlsx');
  };

  // ── Leitura do arquivo ─────────────────────────────────────────
  const handleFile = async (file) => {
    setFileError('');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setFileError('Formato inválido. Use .xlsx, .xls ou .csv.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', codepage: 65001 }); // UTF-8
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (!raw || raw.length < 2) {
        setFileError('O arquivo está vazio ou não possui dados além do cabeçalho.');
        return;
      }

      const headers = raw[0];
      const parsed = raw
        .slice(1)
        .map(row => parseRow(row, headers))
        .filter(r => r.name.length > 0);   // linha válida = tem nome

      if (parsed.length === 0) {
        setFileError('Nenhum cliente com nome encontrado. Verifique se a coluna "Nome" está preenchida.');
        return;
      }

      setRows(parsed);
      setFileName(file.name);
      setStep(2);
    } catch {
      setFileError('Não foi possível ler o arquivo. Certifique-se de que é um .xlsx ou .csv válido.');
    }
  };

  // ── Importação em lote ─────────────────────────────────────────
  const handleImport = async () => {
    setImporting(true);
    setStep(3);
    let imported = 0, skipped = 0, errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const phoneDigits = r.phone.replace(/\D/g, '');
      try {
        if (phoneDigits && existingPhones.has(phoneDigits)) {
          skipped++;
        } else {
          await base44.entities.Customer.create({
            company_id: companyId,
            name:   r.name,
            phone:  phoneDigits || r.phone || null,
            email:  r.email  || null,
            notes:  r.notes  || null,
            status: 'active',
          });
          imported++;
        }
      } catch {
        errors++;
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setResult({ imported, skipped, errors });
    setImporting(false);
    if (imported > 0) onImported();
  };

  // Duplicatas detectadas na prévia
  const dupCount = rows.filter(r => {
    const d = r.phone.replace(/\D/g, '');
    return d && existingPhones.has(d);
  }).length;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1B3A4B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-[#1B3A4B]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1B1C1E] text-sm">Importar Clientes</h3>
              <p className="text-xs text-gray-400">
                {step === 1 && 'Passo 1 — Prepare e envie seu arquivo'}
                {step === 2 && `Passo 2 — Confirme os ${rows.length} clientes detectados`}
                {step === 3 && (importing ? `Importando... ${progress}%` : 'Importação concluída!')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── Passo 1: instruções + upload ── */}
          {step === 1 && (<>
            {/* Baixar modelo */}
            <div className="bg-[#F7F3EC] rounded-2xl p-4">
              <p className="text-sm font-bold text-[#1B1C1E] mb-1">1. Baixe o modelo (opcional)</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Preencha com seus clientes no Excel ou Google Planilhas.
                Colunas: <strong>Nome, Telefone, Email, Observações</strong>.
                Também funciona se você já tiver uma planilha própria — basta ter uma coluna "Nome".
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 bg-white border border-black/10 text-sm font-semibold px-4 py-2.5 rounded-xl hover:shadow-sm transition-all">
                <Download className="w-4 h-4 text-[#1B3A4B]" />
                Baixar modelo .xlsx
              </button>
            </div>

            {/* Upload */}
            <div>
              <p className="text-sm font-bold text-[#1B1C1E] mb-2">2. Envie seu arquivo preenchido</p>
              <div
                className="border-2 border-dashed border-[#1B3A4B]/25 rounded-2xl p-8 text-center cursor-pointer hover:border-[#1B3A4B]/60 hover:bg-[#F8F7F3] transition-all"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
                <Upload className="w-8 h-8 text-[#1B3A4B]/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1B1C1E]">Clique ou arraste o arquivo aqui</p>
                <p className="text-xs text-gray-400 mt-1">Aceita .xlsx, .xls e .csv</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
              {fileError && (
                <div className="flex items-start gap-2 text-red-600 text-xs mt-2 bg-red-50 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {fileError}
                </div>
              )}
            </div>
          </>)}

          {/* ── Passo 2: prévia ── */}
          {step === 2 && (<>
            <div className="flex items-center gap-2 bg-[#F8F7F3] rounded-xl px-3 py-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1B3A4B]" />
              <span className="text-xs text-gray-600 truncate">{fileName}</span>
              <span className="ml-auto text-xs font-bold text-[#1B3A4B]">{rows.length} clientes</span>
            </div>

            <p className="text-xs text-gray-500">Prévia dos primeiros registros — verifique se os dados estão corretos antes de importar.</p>

            <div className="space-y-2">
              {rows.slice(0, 6).map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F8F7F3] rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#1B3A4B]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#1B3A4B]">{(r.name[0] || '?').toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B1C1E] truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[r.phone, r.email].filter(Boolean).join(' · ') || 'Sem contato'}
                    </p>
                  </div>
                  {r.phone && existingPhones.has(r.phone.replace(/\D/g, '')) && (
                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg flex-shrink-0">já existe</span>
                  )}
                </div>
              ))}
              {rows.length > 6 && (
                <p className="text-xs text-gray-400 text-center py-1">
                  + {rows.length - 6} clientes não mostrados na prévia
                </p>
              )}
            </div>

            {dupCount > 0 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-4 py-3 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>{dupCount} cliente{dupCount > 1 ? 's' : ''}</strong> já exist{dupCount > 1 ? 'em' : 'e'} no sistema (mesmo telefone) e ser{dupCount > 1 ? 'ão' : 'á'} ignorado{dupCount > 1 ? 's' : ''} na importação.
                </span>
              </div>
            )}
          </>)}

          {/* ── Passo 3: progresso / resultado ── */}
          {step === 3 && (
            <div className="text-center py-6">
              {importing ? (<>
                <div className="w-16 h-16 border-4 border-[#E8DED0] border-t-[#1B3A4B] rounded-full animate-spin mx-auto mb-5" />
                <p className="font-semibold text-[#1B1C1E] mb-4">Importando clientes...</p>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1.5">
                  <div
                    className="bg-[#1B3A4B] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-400">{progress}% concluído</p>
              </>) : result && (<>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-black text-xl text-[#1B1C1E] mb-5">Importação concluída!</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4">
                    <p className="text-3xl font-black text-green-700">{result.imported}</p>
                    <p className="text-xs text-green-600 font-semibold mt-1">Importados</p>
                  </div>
                  <div className="bg-yellow-50 rounded-2xl p-4">
                    <p className="text-3xl font-black text-yellow-600">{result.skipped}</p>
                    <p className="text-xs text-yellow-600 font-semibold mt-1">Já existiam</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4">
                    <p className="text-3xl font-black text-red-600">{result.errors}</p>
                    <p className="text-xs text-red-500 font-semibold mt-1">Erros</p>
                  </div>
                </div>
                {result.errors > 0 && (
                  <p className="text-xs text-gray-400 mt-4">
                    Linhas com erro foram puladas. Verifique se os dados estão completos no arquivo.
                  </p>
                )}
              </>)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-black/6">
          {step === 1 && (
            <button onClick={onClose} className="w-full py-3 border border-black/10 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-black/10 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Voltar
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-3 bg-[#1B3A4B] text-white rounded-xl text-sm font-semibold hover:bg-[#1B3A4B]/90 transition-colors flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Importar {rows.length - dupCount} clientes
              </button>
            </div>
          )}
          {step === 3 && !importing && (
            <button onClick={onClose} className="w-full py-3 bg-[#1B3A4B] text-white rounded-xl text-sm font-semibold hover:bg-[#1B3A4B]/90 transition-colors">
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
