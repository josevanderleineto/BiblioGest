import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Library } from '../../types';
import { Building2, Clock, Edit3, Mail, Phone, Plus, Power, Trash2, X } from 'lucide-react';

type LibraryForm = Omit<Library, 'id' | 'isActive'>;
const emptyForm: LibraryForm = { code: '', name: '', address: '', city: '', state: '', phone: '', email: '', openingHours: '' };

export const LibraryListPage: React.FC = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [form, setForm] = useState<LibraryForm>(emptyForm);
  const [editing, setEditing] = useState<Library | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLibraries = async () => {
    try { setLibraries((await api.get('/libraries')).data); }
    catch { setMessage({ type: 'error', text: 'Não foi possível carregar as unidades.' }); }
  };
  useEffect(() => { loadLibraries(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); setMessage(null); };
  const openEdit = (library: Library) => {
    setEditing(library);
    setForm({ code: library.code, name: library.name, address: library.address || '', city: library.city || '', state: library.state || '', phone: library.phone || '', email: library.email || '', openingHours: library.openingHours || '' });
    setShowForm(true); setMessage(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null);
    try {
      if (editing) await api.put(`/libraries/${editing.id}`, { ...form, isActive: editing.isActive });
      else await api.post('/libraries', form);
      setMessage({ type: 'success', text: editing ? 'Unidade atualizada.' : 'Nova unidade criada.' });
      setShowForm(false); await loadLibraries();
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.error || 'Não foi possível salvar a unidade.' }); }
    finally { setSaving(false); }
  };

  const toggleActive = async (library: Library) => {
    try { await api.put(`/libraries/${library.id}`, { ...library, isActive: !library.isActive }); await loadLibraries(); }
    catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.error || 'Não foi possível alterar a unidade.' }); }
  };

  const remove = async (library: Library) => {
    if (!window.confirm(`Remover definitivamente a unidade “${library.name}”? Esta ação só é permitida quando não há usuários ou exemplares vinculados.`)) return;
    try { await api.delete(`/libraries/${library.id}`); setMessage({ type: 'success', text: 'Unidade removida.' }); await loadLibraries(); }
    catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.error || 'Não foi possível remover a unidade.' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-brand-500" />Unidades & Bibliotecas da Rede</h1><p className="text-xs text-slate-500">Cadastre, edite, inative ou remova unidades da sua rede.</p></div><button onClick={openNew} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2"><Plus className="w-4 h-4" />Nova unidade</button></div>
      {message && <div className={`p-3 rounded-lg text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{message.text}</div>}

      {showForm && <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-brand-200 dark:border-brand-900 shadow-sm space-y-4"><div className="flex justify-between items-center"><h2 className="font-bold text-sm uppercase tracking-wider">{editing ? 'Editar unidade' : 'Nova unidade de informação'}</h2><button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><label className="font-semibold">Código *<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex.: MAB" className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold">Nome da unidade *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Biblioteca do MAB" className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold">Endereço<input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold">Cidade / UF<input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Salvador / BA" className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold">Telefone<input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold">E-mail<input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label><label className="font-semibold md:col-span-2">Horário de atendimento<input value={form.openingHours || ''} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-900 font-normal" /></label></div><button disabled={saving} className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg text-sm">{saving ? 'Salvando...' : 'Salvar unidade'}</button></form>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{libraries.map((library) => <div key={library.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"><div className="flex items-start justify-between"><div><span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-950 px-2 py-0.5 rounded">{library.code}</span><h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{library.name}</h3></div><span title={library.isActive ? 'Ativa' : 'Inativa'} className={`w-2.5 h-2.5 rounded-full ${library.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} /></div><div className="text-xs text-slate-500 space-y-1"><div>{library.address || 'Endereço não informado'} {library.city && `— ${library.city}${library.state ? `/${library.state}` : ''}`}</div><div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-brand-500" />{library.phone || 'Sem telefone'}</div><div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-500" />{library.email || 'Sem e-mail'}</div><div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" />{library.openingHours || 'Horário não informado'}</div></div><div className="pt-2 border-t dark:border-slate-700 flex gap-2"><button onClick={() => openEdit(library)} className="px-2.5 py-1.5 text-xs font-bold rounded bg-slate-100 dark:bg-slate-700 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />Editar</button><button onClick={() => toggleActive(library)} className="px-2.5 py-1.5 text-xs font-bold rounded bg-amber-50 text-amber-700 flex items-center gap-1"><Power className="w-3.5 h-3.5" />{library.isActive ? 'Inativar' : 'Ativar'}</button><button onClick={() => remove(library)} className="px-2.5 py-1.5 text-xs font-bold rounded bg-rose-50 text-rose-700 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Remover</button></div></div>)}</div>
    </div>
  );
};
