import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BibliographicRecord } from '../../types';
import { BookOpen, Plus, Search, Filter, Download, Trash2, Edit3, Layers, BookPlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const CatalogListPage: React.FC = () => {
  const [records, setRecords] = useState<BibliographicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [materialType, setMaterialType] = useState('');

  const navigate = useNavigate();

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (materialType) params.append('materialType', materialType);

      const res = await api.get(`/catalog?${params.toString()}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Catalog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [materialType]);

  const handleExport = async (id: string, format: 'marc' | 'ris' | 'bibtex') => {
    window.open(`${api.defaults.baseURL}/catalog/${id}/export?format=${format}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta obra bibliográfica?')) return;
    try {
      await api.delete(`/catalog/${id}`);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir obra.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span>Acervo Bibliográfico</span>
          </h1>
          <p className="text-xs text-slate-500">Gestão de registros catalogados em MARC21, RDA e Classificação CDD/CDU</p>
        </div>

        <button
          onClick={() => navigate('/catalog/new')}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all text-sm flex items-center gap-2"
        >
          <BookPlus className="w-4 h-4" />
          <span>Nova Catalogação</span>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
            placeholder="Pesquisar título, autor, ISBN, classificação CDD..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm dark:text-white"
          />
        </div>

        <select
          value={materialType}
          onChange={(e) => setMaterialType(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white"
        >
          <option value="">Todos os Tipos</option>
          <option value="LIVRO">Livro</option>
          <option value="EBOOK">E-book</option>
          <option value="PERIODICO">Periódico</option>
          <option value="TCC">TCC / Tese</option>
          <option value="AUDIOVISUAL">Audiovisual</option>
        </select>

        <button
          onClick={fetchCatalog}
          className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg text-sm"
        >
          Buscar
        </button>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Título / Subtítulo</th>
                <th className="p-3">Autor(es)</th>
                <th className="p-3">Chamada (CDD/Cutter)</th>
                <th className="p-3">ISBN/ISSN</th>
                <th className="p-3">Exemplares</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">Carregando acervo...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3">
                      <span className="font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 px-2 py-0.5 rounded text-[10px]">
                        {rec.materialType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{rec.title}</div>
                      {rec.subtitle && <div className="text-[11px] font-normal text-slate-500">{rec.subtitle}</div>}
                    </td>
                    <td className="p-3">{rec.authors || '-'}</td>
                    <td className="p-3 font-mono text-slate-500">{rec.callNumber || rec.cddNotation || '-'}</td>
                    <td className="p-3">{rec.isbn || rec.issn || '-'}</td>
                    <td className="p-3 font-bold text-brand-600">{rec.items?.length || 0}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleExport(rec.id, 'marc')}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded text-[10px] font-semibold"
                        title="Exportar MARC21 Text"
                      >
                        MARC
                      </button>
                      <button
                        onClick={() => handleExport(rec.id, 'ris')}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded text-[10px] font-semibold"
                        title="Exportar RIS"
                      >
                        RIS
                      </button>
                      <button
                        onClick={() => navigate(`/catalog/edit/${rec.id}`)}
                        className="p-1 text-slate-400 hover:text-brand-600"
                        title="Editar Catalogação"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Excluir Registros"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
