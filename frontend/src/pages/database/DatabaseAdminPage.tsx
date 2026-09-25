import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Library } from '../../types';
import { Building2, CheckCircle2, Database, Download, Handshake, Save, ShieldAlert, Upload } from 'lucide-react';

type Message = { type: 'success' | 'error'; text: string };
type Profile = { SYSTEM_NAME: string; LIBRARY_NAME: string; INFORMATION_UNIT_NAME: string; OPAC_DESCRIPTION: string };

const initialProfile: Profile = {
  SYSTEM_NAME: 'BiblioGest - Sistema Integrado de Biblioteca', LIBRARY_NAME: '', INFORMATION_UNIT_NAME: '', OPAC_DESCRIPTION: '',
};

export const DatabaseAdminPage: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [profileMsg, setProfileMsg] = useState<Message | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [targetLibraryId, setTargetLibraryId] = useState('');
  const [dataMsg, setDataMsg] = useState<Message | null>(null);
  const [busyAction, setBusyAction] = useState<'restore' | 'import' | null>(null);

  useEffect(() => {
    api.get('/settings').then((res) => setProfile((current) => ({ ...current, ...res.data }))).catch(() => undefined);
    api.get('/libraries').then((res) => setLibraries(res.data)).catch(() => undefined);
  }, []);

  const handleTestConnection = async () => {
    setLoadingTest(true);
    try { setTestResult((await api.post('/database/test-connection', {})).data); }
    catch { setTestResult({ success: false, message: '✕ Não foi possível conectar ao PostgreSQL.' }); }
    finally { setLoadingTest(false); }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setSavingProfile(true); setProfileMsg(null);
    try {
      const res = await api.put('/settings', profile);
      setProfile((current) => ({ ...current, ...res.data }));
      setProfileMsg({ type: 'success', text: 'Identidade da biblioteca salva.' });
    } catch (err: any) { setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Não foi possível salvar as configurações.' }); }
    finally { setSavingProfile(false); }
  };

  const handleDownloadBackup = async () => {
    setDataMsg(null);
    try {
      const res = await api.get('/database/backup', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bibliogest_backup_${Date.now()}.json`; anchor.click(); URL.revokeObjectURL(url);
      setDataMsg({ type: 'success', text: 'Backup baixado com sucesso.' });
    } catch (err: any) { setDataMsg({ type: 'error', text: err.response?.data?.error || 'Não foi possível gerar o backup.' }); }
  };

  const handleDownloadCatalogBackup = async () => {
    setDataMsg(null);
    try {
      const res = await api.get('/database/catalog-backup', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bibliogest_acervo_${Date.now()}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
      setDataMsg({ type: 'success', text: 'Planilha do acervo catalogado baixada com sucesso.' });
    } catch (err: any) { setDataMsg({ type: 'error', text: err.response?.data?.error || 'Não foi possível gerar a planilha do acervo.' }); }
  };

  const downloadCatalogFile = async (path: string, filename: string, type: string, successMessage: string) => {
    setDataMsg(null);
    try {
      const res = await api.get(path, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
      setDataMsg({ type: 'success', text: successMessage });
    } catch (err: any) { setDataMsg({ type: 'error', text: err.response?.data?.error || 'Não foi possível exportar o acervo.' }); }
  };

  const readSelectedFile = async () => {
    if (!dataFile) throw new Error('Selecione um arquivo de backup .json.');
    let parsed: unknown;
    try { parsed = JSON.parse(await dataFile.text()); } catch { throw new Error('O arquivo selecionado não contém JSON válido.'); }
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) throw new Error('Este não é um backup válido do BiblioGest.');
    return parsed;
  };

  const handleImport = async () => {
    setBusyAction('import'); setDataMsg(null);
    try {
      await api.post('/database/import', { backupData: await readSelectedFile(), targetLibraryId: targetLibraryId || undefined });
      setDataMsg({ type: 'success', text: 'Dados colaborativos incorporados sem apagar os registros existentes.' });
    } catch (err: any) { setDataMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Erro ao importar dados.' }); }
    finally { setBusyAction(null); }
  };

  const handleRestore = async (event: React.FormEvent) => {
    event.preventDefault(); setDataMsg(null);
    if (restoreConfirmation !== 'RESTAURAR') { setDataMsg({ type: 'error', text: 'Digite exatamente RESTAURAR para confirmar.' }); return; }
    setBusyAction('restore');
    try {
      const res = await api.post('/database/restore', { confirmation: restoreConfirmation, backupData: await readSelectedFile() });
      setDataMsg({ type: 'success', text: res.data.message });
    } catch (err: any) { setDataMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Erro ao restaurar backup.' }); }
    finally { setBusyAction(null); }
  };

  const messageClass = (message: Message) => message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div><h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2"><Database className="w-6 h-6 text-cyan-500" />Administração, configurações e dados</h1><p className="text-xs text-slate-500">Personalize a unidade de informação e mantenha cópias seguras do acervo</p></div>

      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-500" /><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Identidade da biblioteca</h2></div>
        {profileMsg && <div className={`p-3 rounded-lg text-xs font-bold ${messageClass(profileMsg)}`}>{profileMsg.text}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <label className="font-semibold">Nome do sistema<input required value={profile.SYSTEM_NAME} onChange={(e) => setProfile({ ...profile, SYSTEM_NAME: e.target.value })} className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 font-normal" /></label>
          <label className="font-semibold">Nome da biblioteca<input required value={profile.LIBRARY_NAME} onChange={(e) => setProfile({ ...profile, LIBRARY_NAME: e.target.value })} className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 font-normal" /></label>
          <label className="font-semibold">Unidade de informação<input required value={profile.INFORMATION_UNIT_NAME} onChange={(e) => setProfile({ ...profile, INFORMATION_UNIT_NAME: e.target.value })} className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 font-normal" /></label>
          <label className="font-semibold">Descrição do catálogo público<input required value={profile.OPAC_DESCRIPTION} onChange={(e) => setProfile({ ...profile, OPAC_DESCRIPTION: e.target.value })} className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2 font-normal" /></label>
        </div>
        <button disabled={savingProfile} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold rounded-lg text-sm flex items-center gap-2"><Save className="w-4 h-4" />{savingProfile ? 'Salvando...' : 'Salvar personalização'}</button>
      </form>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Status da conexão PostgreSQL</h2><p className="text-xs text-slate-500 mt-1">Verifique a DATABASE_URL configurada no servidor.</p></div><button onClick={handleTestConnection} disabled={loadingTest} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs">{loadingTest ? 'Testando...' : 'Testar conexão'}</button></div>
        {testResult && <div className={`p-4 rounded-xl text-sm font-medium border flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}><CheckCircle2 className="w-5 h-5 shrink-0" /><div><div className="font-bold">{testResult.message}</div></div></div>}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-900/40 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Backup do acervo catalogado</h2><p className="text-xs text-slate-500 mt-1">Planilha para guarda e conferência; MARC21 (.mrc) para importar em outros sistemas; arquivo BiblioGest para importar este catálogo em outra biblioteca.</p></div><div className="flex flex-wrap gap-2"><button onClick={handleDownloadCatalogBackup} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Download className="w-4 h-4" />Planilha</button><button onClick={() => downloadCatalogFile('/database/catalog-backup.mrc', `bibliogest_acervo_${Date.now()}.mrc`, 'application/marc', 'Arquivo MARC21 exportado com sucesso.')} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Download className="w-4 h-4" />MARC21 (.mrc)</button><button onClick={() => downloadCatalogFile('/database/catalog-backup.json', `bibliogest_catalogo_${Date.now()}.json`, 'application/json', 'Arquivo de importação do BiblioGest baixado com sucesso.')} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Download className="w-4 h-4" />Importar no BiblioGest</button></div></div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Backup completo do sistema</h2><p className="text-xs text-slate-500 mt-1">Inclui também usuários, permissões, circulação, configurações e auditoria. Use para recuperação integral do BiblioGest.</p></div><button onClick={handleDownloadBackup} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Download className="w-4 h-4" />Baixar completo</button></div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Importação de catálogo BiblioGest</h2><p className="text-xs text-slate-500 mt-1">Importa o arquivo “Importar no BiblioGest” sem apagar os registros existentes. Selecione uma biblioteca para direcionar os exemplares importados.</p></div>
        {dataMsg && <div className={`p-3 rounded-lg text-xs font-bold ${messageClass(dataMsg)}`}>{dataMsg.text}</div>}
        <input type="file" accept="application/json,.json" onChange={(e) => setDataFile(e.target.files?.[0] || null)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2 text-xs" />
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Biblioteca de destino dos exemplares (opcional)
          <select value={targetLibraryId} onChange={(e) => setTargetLibraryId(e.target.value)} className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2 text-sm font-normal dark:text-white"><option value="">Manter a biblioteca registrada no arquivo</option>{libraries.filter((library) => library.isActive).map((library) => <option key={library.id} value={library.id}>{library.code} — {library.name}</option>)}</select>
        </label>
        <button type="button" onClick={handleImport} disabled={busyAction !== null} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Handshake className="w-4 h-4" />{busyAction === 'import' ? 'Importando...' : 'Importar sem substituir'}</button>
      </div>

      <form onSubmit={handleRestore} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-800"><ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" /><div className="text-xs"><strong className="font-bold uppercase block text-sm">Restauração completa</strong>Substitui somente os dados do BiblioGest pelo conteúdo do arquivo; as tabelas legadas não são tocadas.</div></div>
        <label className="font-semibold block text-xs text-rose-700 dark:text-rose-300">Digite RESTAURAR para continuar:<input type="text" required value={restoreConfirmation} onChange={(e) => setRestoreConfirmation(e.target.value)} placeholder="RESTAURAR" className="mt-1 w-full bg-slate-50 dark:bg-slate-900 border border-rose-300 rounded px-3 py-2 font-mono font-bold" /></label>
        <button disabled={busyAction !== null} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Upload className="w-4 h-4" />{busyAction === 'restore' ? 'Restaurando...' : 'Executar restauração'}</button>
      </form>
    </div>
  );
};
