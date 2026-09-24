import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BookOpen, User, Lock, AlertCircle } from 'lucide-react';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponível')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile indisponível')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponível'));
    script.onerror = () => reject(new Error('Turnstile indisponível'));
    document.head.appendChild(script);
  });
}

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainer.current) return;

    let active = true;
    let widgetId: string | undefined;
    loadTurnstile()
      .then((turnstile) => {
        if (!active || !turnstileContainer.current) return;
        widgetId = turnstile.render(turnstileContainer.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileError('');
          },
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileError('Não foi possível carregar a verificação de segurança.'),
          theme: 'auto',
        });
      })
      .catch(() => active && setTurnstileError('Não foi possível carregar a verificação de segurança.'));

    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (turnstileSiteKey && !turnstileToken) {
      setError('Conclua a verificação de segurança para continuar.');
      return;
    }
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password, turnstileToken, website: '' });
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
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute h-px w-px -left-[10000px] opacity-0"
          />
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

          {turnstileSiteKey && <div ref={turnstileContainer} className="flex justify-center" />}
          {turnstileError && <p className="text-sm text-rose-600 dark:text-rose-300">{turnstileError}</p>}

          <button
            type="submit"
            disabled={loading || Boolean(turnstileSiteKey && !turnstileToken)}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>

        {/* Initial login notice */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use a conta criada pelo administrador do sistema. As credenciais nunca são exibidas nesta página.
          </p>
          <div className="flex items-center justify-center text-xs font-medium">
            <Link to="/opac" className="text-brand-500 hover:underline flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Catálogo Público (OPAC)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
