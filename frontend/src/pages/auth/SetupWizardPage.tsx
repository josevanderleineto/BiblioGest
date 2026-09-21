import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CheckCircle2, XCircle, Database, Server, Link as LinkIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SetupWizardPage: React.FC = () => {
  const [dbMode, setDbMode] = useState<'local' | 'remote' | 'env'>('local');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('bibliogest');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPassword, setDbPassword] = useState('postgrespassword');
  const [databaseUrl, setDatabaseUrl] = useState('postgresql://postgres:postgres@localhost:5432/bibliogest?schema=public');
  
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [testing, setTesting] = useState(false);
  const [installed, setInstalled] = useState(false);

  const navigate = useNavigate();

  const getComputedUrl = () => {
    if (dbMode === 'env') return databaseUrl;
    const host = dbMode === 'local' ? 'localhost' : dbHost;
    return `postgresql://${dbUser}:${dbPassword}@${host}:${dbPort}/${dbName}?schema=public`;
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.post('/database/test-connection', {
        databaseUrl: getComputedUrl(),
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || '✕ Não foi possível conectar ao PostgreSQL.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              B
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">BiblioGest — Instalação & Banco de Dados</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configuração automática de conectividade PostgreSQL</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-semibold rounded-full">
            Passo 1 de 2
          </span>
        </div>

        {/* Database Mode Radio Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Selecione a Origem do Banco de Dados PostgreSQL:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDbMode('local')}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                dbMode === 'local'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <Database className="w-5 h-5 text-brand-500" />
              <div>
                <div className="font-semibold text-sm">PostgreSQL Local</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">localhost:5432</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDbMode('remote')}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                dbMode === 'remote'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <Server className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="font-semibold text-sm">PostgreSQL Remoto</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Host / Nuvem externa</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDbMode('env')}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                dbMode === 'env'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <LinkIcon className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-semibold text-sm">DATABASE_URL</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">String de Conexão</div>
              </div>
            </button>
          </div>
        </div>

        {/* Inputs */}
        {dbMode === 'env' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">DATABASE_URL</label>
            <input
              type="text"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Host</label>
              <input
                type="text"
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Porta</label>
              <input
                type="text"
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Banco de Dados</label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Usuário</label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* Test Connection Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm">{testResult.message}</div>
              {testResult.details && (
                <div className="text-xs mt-1 space-y-0.5 opacity-90">
                  <div>Banco: {testResult.details.database}</div>
                  <div>Usuário: {testResult.details.user}</div>
                  <div>Versão: {testResult.details.version}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold rounded-lg transition-all text-sm"
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/20 transition-all text-sm flex items-center gap-2"
          >
            <span>Ir para Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
