import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MarcField, MaterialType } from '../../types';
import { Marc21Editor } from '../../components/Marc21Editor';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft, Wand2, Plus, Trash2, Layers } from 'lucide-react';
import { generateCutterNotation, generateCallNumber } from '../../utils/cutter';


export const CatalogFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [materialType, setMaterialType] = useState<MaterialType>('LIVRO');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [statementOfResp, setStatementOfResp] = useState('');
  const [publicationYear, setPublicationYear] = useState<string>('2026');
  const [publisher, setPublisher] = useState('');
  const [placeOfPublication, setPlaceOfPublication] = useState('');
  const [edition, setEdition] = useState('');
  const [isbn, setIsbn] = useState('');
  const [issn, setIssn] = useState('');
  const [language, setLanguage] = useState('por');
  const [summary, setSummary] = useState('');
  const [subjects, setSubjects] = useState('');
  const [cddNotation, setCddNotation] = useState('025.04');
  const [cduNotation, setCduNotation] = useState('');
  const [cutterNotation, setCutterNotation] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [marcFields, setMarcFields] = useState<MarcField[]>([]);
  const [items, setItems] = useState<{ barcode: string; tombo: string; libraryId: string; location: string; shelf: string }[]>([]);
  const [libraries, setLibraries] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/libraries').then((res) => setLibraries(res.data));

    if (!isEditing) {
      // Fetch default MARC21 template for selected material type
      api.get(`/catalog/template/${materialType}`).then((res) => setMarcFields(res.data));
    } else {
      api.get(`/catalog/${id}`).then((res) => {
        const d = res.data;
        setMaterialType(d.materialType);
        setTitle(d.title);
        setSubtitle(d.subtitle || '');
        setAuthors(d.authors || '');
        setStatementOfResp(d.statementOfResp || '');
        setPublicationYear(d.publicationYear?.toString() || '');
        setPublisher(d.publisher || '');
        setPlaceOfPublication(d.placeOfPublication || '');
        setEdition(d.edition || '');
        setIsbn(d.isbn || '');
        setIssn(d.issn || '');
        setLanguage(d.language || 'por');
        setSummary(d.summary || '');
        setSubjects(d.subjects || '');
        setCddNotation(d.cddNotation || '');
        setCduNotation(d.cduNotation || '');
        setCutterNotation(d.cutterNotation || '');
        setCallNumber(d.callNumber || '');
        setCoverUrl(d.coverUrl || '');
        if (d.marcData) setMarcFields(d.marcData);
      });
    }
  }, [id, materialType]);

  const handleAutoCutter = () => {
    const c = generateCutterNotation(authors, title);
    setCutterNotation(c);
    const fullCall = generateCallNumber(cddNotation || cduNotation, authors, title, publicationYear ? parseInt(publicationYear, 10) : undefined);
    setCallNumber(fullCall);
  };

  const handleAddItem = () => {
    const nextBarcode = (100000 + Math.floor(Math.random() * 800000)).toString();
    const nextTombo = `T-2026-${Math.floor(Math.random() * 900 + 100)}`;
    setItems([...items, { barcode: nextBarcode, tombo: nextTombo, libraryId: libraries[0]?.id || '', location: 'Acervo Geral', shelf: 'Estante 01' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        materialType,
        title,
        subtitle,
        authors,
        statementOfResp,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        publisher,
        placeOfPublication,
        edition,
        isbn,
        issn,
        language,
        summary,
        subjects,
        cddNotation,
        cduNotation,
        cutterNotation,
        callNumber,
        coverUrl,
        marcData: marcFields,
      };

      let biblioId = id;
      if (isEditing) {
        await api.put(`/catalog/${id}`, payload);
      } else {
        const res = await api.post('/catalog', payload);
        biblioId = res.data.id;
      }

      // Create new exemplares/items if added
      for (const item of items) {
        if (item.libraryId) {
          await api.post('/items', {
            biblioId,
            libraryId: item.libraryId,
            barcode: item.barcode,
            tombo: item.tombo,
            location: item.location,
            shelf: item.shelf,
          });
        }
      }

      // Ao cadastrar exemplares, siga diretamente para as etiquetas deles.
      navigate(items.length > 0 ? `/catalog/labels?biblioId=${biblioId}` : '/catalog');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar catalogação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/catalog')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isEditing ? 'Editar Registros Bibliográficos' : 'Nova Catalogação Bibliográfica (MARC21)'}
            </h1>
            <p className="text-xs text-slate-500">Padrão MARC21 Bibliográfico & RDA</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 text-sm"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Salvando...' : 'Salvar Obra'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Metadata Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Informações Gerais da Obra
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tipo de Material</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              >
                <option value="LIVRO">Livro</option>
                <option value="EBOOK">E-book</option>
                <option value="PERIODICO">Periódico</option>
                <option value="TCC">TCC / Dissertação / Tese</option>
                <option value="AUDIOVISUAL">Audiovisual</option>
                <option value="OBRA_RARA">Obra Rara</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Título Principal *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Subtítulo</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Autor Principal (Sobrenome, Nome)</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Ex: Silva, Edson"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Editora</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ano de Publicação</label>
              <input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-85-..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ISSN</label>
              <input
                type="text"
                value={issn}
                onChange={(e) => setIssn(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Edição</label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="Ex: 2. ed."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Classification & Cutter Generator Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Classificação Decimal & Número de Chamada
            </h3>
            <button
              type="button"
              onClick={handleAutoCutter}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-indigo-100"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Gerar Notação Cutter Automática</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Classificação CDD</label>
              <input
                type="text"
                value={cddNotation}
                onChange={(e) => setCddNotation(e.target.value)}
                placeholder="Ex: 005.133"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Classificação CDU</label>
              <input
                type="text"
                value={cduNotation}
                onChange={(e) => setCduNotation(e.target.value)}
                placeholder="Ex: 004.43"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Notação Cutter-Sanborn</label>
              <input
                type="text"
                value={cutterNotation}
                onChange={(e) => setCutterNotation(e.target.value)}
                placeholder="Ex: S586i"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Número de Chamada Completo</label>
              <input
                type="text"
                value={callNumber}
                onChange={(e) => setCallNumber(e.target.value)}
                placeholder="Ex: 005.133 S586i 2026"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-brand-600 dark:text-brand-400"
              />
            </div>
          </div>
        </div>

        {/* MARC21 Interactive Editor */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Editor MARC21 Bibliográfico
          </h3>
          <Marc21Editor fields={marcFields} onChange={setMarcFields} />
        </div>

        {/* Exemplares / Items Sub-Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Exemplares Físicos (Itens)
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold rounded-lg text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Novo Exemplar (Barcode & Tombo)</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="font-semibold block text-slate-500">Barcode</label>
                  <input
                    type="text"
                    value={it.barcode}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].barcode = e.target.value;
                      setItems(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border rounded px-2 py-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-500">Tombo</label>
                  <input
                    type="text"
                    value={it.tombo}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].tombo = e.target.value;
                      setItems(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border rounded px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-500">Unidade Biblioteca</label>
                  <select
                    value={it.libraryId}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].libraryId = e.target.value;
                      setItems(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border rounded px-2 py-1"
                  >
                    {libraries.map((lib) => (
                      <option key={lib.id} value={lib.id}>{lib.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block text-slate-500">Localização / Estante</label>
                  <input
                    type="text"
                    value={it.location}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].location = e.target.value;
                      setItems(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...items];
                      updated.splice(idx, 1);
                      setItems(updated);
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
