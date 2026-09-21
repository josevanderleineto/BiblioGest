import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BookOpen, KeyRound, User, Lock, AlertCircle, Wrench } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.user, res.data.mustChangePassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-lg shadow-brand-500/30 mb-3">
            B
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">BiblioGest</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistema Integrado de Gestão de Biblioteca</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Usuário, E-mail ou Matrícula
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>

        {/* Initial login notice */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No primeiro acesso, use as credenciais definidas em <code>DEFAULT_ADMIN_USERNAME</code> e <code>DEFAULT_ADMIN_PASSWORD</code> no arquivo <code>.env</code>.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-medium">
            <Link to="/opac" className="text-brand-500 hover:underline flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Catálogo Público (OPAC)
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/setup" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              Assistente de Instalação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
