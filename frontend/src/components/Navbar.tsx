import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User as UserIcon, Shield, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
      {/* Global Quick Search */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por título, autor, ISBN, barcode..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/catalog?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-slate-200"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* User profile dropdown */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 font-bold flex items-center justify-center text-sm border border-brand-200 dark:border-brand-700">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">
              {user?.name || 'Usuário'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-brand-500" />
              <span>{user?.role || 'Bibliotecário'}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="ml-2 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
