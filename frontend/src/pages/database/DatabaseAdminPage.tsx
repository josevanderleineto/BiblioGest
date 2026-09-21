import React, { useState } from 'react';
import { api } from '../../services/api';
import { Database, Download, Upload, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const DatabaseAdminPage: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTestConnection = async () => {
    setLoadingTest(true);
    try {
      const res = await api.post('/database/test-connection', {});
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ success: false, message: '✕ Não foi possível conectar ao PostgreSQL.' });
    } finally {
      setLoadingTest(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open(`${api.defaults.baseURL}/database/backup`, '_blank');
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreMsg(null);

    if (restoreConfirmation !== 'RESTAURAR') {
      setRestoreMsg({ type: 'error', text: 'Você precisa digitar exatamente a palavra RESTAURAR para confirmar.' });
      return;
    }

    try {
      const res = await api.post('/database/restore', {
        confirmation: restoreConfirmation,
        backupData: { data: {} },
      });
      setRestoreMsg({ type: 'success', text: res.data.message });
    } catch (err: any) {
      setRestoreMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao restaurar backup.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-500" />
          <span>Administração do Banco de Dados & Backups</span>
        </h1>
        <p className="text-xs text-slate-500">Status PostgreSQL, backup e restauração de segurança</p>
      </div>

      {/* Connection Status Box */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Status da Conexão PostgreSQL
          </h3>
          <button
            onClick={handleTestConnection}
            disabled={loadingTest}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs"
          >
            {loadingTest ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-sm font-medium border flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-bold">{testResult.message}</div>
              {testResult.details && (
                <div className="text-xs mt-1 space-y-0.5">
                  <div>Banco: {testResult.details.database}</div>
                  <div>Usuário: {testResult.details.user}</div>
                  <div>Engine: {testResult.details.version}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backup Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Gerar Backup Completo (.json / .sql)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Exporta uma cópia de segurança de todas as obras, usuários, empréstimos e regras</p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Gerar Backup</span>
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold uppercase block text-sm">ATENÇÃO — Restauração do Banco de Dados</strong>
            A restauração poderá substituir dados existentes. Certifique-se de possuir uma cópia de segurança recente antes de prosseguir.
          </div>
        </div>

        {restoreMsg && (
          <div className={`p-3 rounded-lg text-xs font-bold ${restoreMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {restoreMsg.text}
          </div>
        )}

        <form onSubmit={handleRestore} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Selecione o Arquivo de Backup (.json ou .sql)</label>
            <input
              type="file"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-rose-600 dark:text-rose-400">
              Digite RESTAURAR para continuar:
            </label>
            <input
              type="text"
              required
              value={restoreConfirmation}
              onChange={(e) => setRestoreConfirmation(e.target.value)}
              placeholder="RESTAURAR"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-300 rounded px-3 py-2 font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Executar Restauração de Dados</span>
          </button>
        </form>
      </div>
    </div>
  );
};
