import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BibliographicRecord } from '../../types';
import { Search, BookOpen, Filter, CheckCircle, XCircle, Tag, Layers, Bookmark, Info, ExternalLink, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const OpacPage: React.FC = () => {
  const [records, setRecords] = useState<BibliographicRecord[]>([]);
  const [search, setSearch] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<BibliographicRecord | null>(null);

  const { theme, toggleTheme } = useTheme();

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (materialType) params.append('materialType', materialType);
      if (availableOnly) params.append('availableOnly', 'true');

      const res = await api.get(`/opac/catalog?${params.toString()}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Opac search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [materialType, availableOnly]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* OPAC Header */}
      <header className="bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xl backdrop-blur-sm border border-white/20">
              B
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">BiblioGest — Catálogo Público (OPAC)</h1>
              <p className="text-xs text-brand-200">Pesquisa e Consulta Integrada do Acervo Bibliográfico</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
            <a
              href="/login"
              className="px-4 py-2 bg-white text-brand-700 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-brand-50 transition-colors shadow-md"
            >
              Acesso Administrativo
            </a>
          </div>
        </div>

        {/* Hero Search Section */}
        <div className="max-w-4xl mx-auto px-6 pb-8 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCatalog();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquise por Título, Autor, Assunto, ISBN, Código de Barras, Classificação CDD/CDU..."
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3.5 shadow-xl text-sm focus:ring-2 focus:ring-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl shadow-xl transition-colors text-sm"
            >
              Pesquisar
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-500" />
              <span>Filtros do Catálogo</span>
            </h3>

            {/* Availability checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Exibir Apenas Obras Disponíveis</span>
            </label>

            {/* Material Type filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Tipo de Material</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white"
              >
                <option value="">Todos os Materiais</option>
                <option value="LIVRO">Livro</option>
                <option value="EBOOK">E-book</option>
                <option value="PERIODICO">Periódico</option>
                <option value="TCC">TCC / Dissertação / Tese</option>
                <option value="AUDIOVISUAL">Audiovisual</option>
                <option value="OBRA_RARA">Obra Rara</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Catalog Results Grid */}
        <section className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {loading ? 'Pesquisando...' : `Resultados (${records.length} obras encontradas)`}
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando catálogo...</div>
          ) : records.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-700 space-y-2">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma obra encontrada para esta pesquisa.</div>
              <p className="text-xs text-slate-500">Tente ajustar os filtros ou digitar outros termos de busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {records.map((rec) => {
                const availableCount = rec.items?.filter((i) => i.status === 'DISPONIVEL').length || 0;
                const totalCount = rec.items?.length || 0;

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-400 transition-all cursor-pointer flex gap-4"
                  >
                    {/* Cover Preview */}
                    <div className="w-20 h-28 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                      {rec.coverUrl ? (
                        <img src={rec.coverUrl} alt={rec.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-8 h-8" />
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 px-2 py-0.5 rounded">
                        {rec.materialType}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate">
                        {rec.title}
                      </h3>
                      {rec.subtitle && <p className="text-xs text-slate-500 truncate">{rec.subtitle}</p>}
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {rec.authors || 'Autor Desconhecido'} {rec.publicationYear && `(${rec.publicationYear})`}
                      </p>

                      {/* Call number & availability badge */}
                      <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-700/60">
                        <span className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                          {rec.callNumber || 'Sem chamada'}
                        </span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            availableCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {availableCount > 0 ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{availableCount}/{totalCount} disp.</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Indisponível</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-500">{selectedRecord.materialType}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedRecord.title}</h2>
                {selectedRecord.subtitle && <p className="text-sm text-slate-500">{selectedRecord.subtitle}</p>}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="block text-xs uppercase text-slate-400 font-bold">Autor(es):</strong>
                <span>{selectedRecord.authors || 'Não informado'}</span>
              </div>
              <div>
                <strong className="block text-xs uppercase text-slate-400 font-bold">Ano / Editora:</strong>
                <span>{selectedRecord.publisher} ({selectedRecord.publicationYear})</span>
              </div>
              <div>
                <strong className="block text-xs uppercase text-slate-400 font-bold">Número de Chamada (CDD/Cutter):</strong>
                <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{selectedRecord.callNumber}</span>
              </div>
              <div>
                <strong className="block text-xs uppercase text-slate-400 font-bold">ISBN / ISSN:</strong>
                <span>{selectedRecord.isbn || selectedRecord.issn || 'N/A'}</span>
              </div>
            </div>

            {selectedRecord.summary && (
              <div>
                <strong className="block text-xs uppercase text-slate-400 font-bold mb-1">Resumo / Linha Editorial:</strong>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {selectedRecord.summary}
                </p>
              </div>
            )}

            {/* Item Availability List */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-2">Exemplares e Disponibilidade</h4>
              <div className="space-y-2">
                {selectedRecord.items?.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-between text-xs border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-bold">Tombo: {item.tombo} | Barcode: {item.barcode}</div>
                      <div className="text-slate-500">{item.library?.name} — {item.location} ({item.shelf})</div>
                    </div>
                    <span className={`px-2 py-1 rounded font-bold ${item.status === 'DISPONIVEL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
