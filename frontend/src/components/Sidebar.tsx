import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ArrowRightLeft,
  Users,
  Building2,
  Newspaper,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Database,
  Settings,
  ChevronDown,
  BookMarked,
  Layers,
  Award,
  BookPlus,
  RotateCcw,
  Receipt,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();
  const [openCatalog, setOpenCatalog] = useState(true);
  const [openCirculation, setOpenCirculation] = useState(true);
  const [openUsers, setOpenUsers] = useState(false);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
          B
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight leading-tight">BiblioGest</h1>
          <span className="text-xs text-brand-400 font-medium">Gestão Bibliotecária</span>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 text-brand-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* OPAC Public Portal button */}
        <NavLink
          to="/opac"
          target="_blank"
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all font-medium border border-emerald-900/50 my-2"
        >
          <div className="flex items-center gap-3">
            <BookMarked className="w-5 h-5" />
            <span>Catálogo Público (OPAC)</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">
            Abrir
          </span>
        </NavLink>

        {/* Módulo Catálogo */}
        <div className="pt-2">
          <button
            onClick={() => setOpenCatalog(!openCatalog)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
          >
            <span>Catálogo</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openCatalog ? 'rotate-180' : ''}`} />
          </button>
          {openCatalog && (
            <div className="mt-1 space-y-1 pl-2 border-l border-slate-800 ml-3">
              <NavLink
                to="/catalog"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <BookOpen className="w-4 h-4" />
                <span>Acervo Bibliográfico</span>
              </NavLink>
              <NavLink
                to="/catalog/new"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <BookPlus className="w-4 h-4" />
                <span>Nova Catalogação (MARC21)</span>
              </NavLink>
              <NavLink
                to="/authorities"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Award className="w-4 h-4" />
                <span>Autoridades</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Módulo Circulação */}
        <div className="pt-2">
          <button
            onClick={() => setOpenCirculation(!openCirculation)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
          >
            <span>Circulação</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openCirculation ? 'rotate-180' : ''}`} />
          </button>
          {openCirculation && (
            <div className="mt-1 space-y-1 pl-2 border-l border-slate-800 ml-3">
              <NavLink
                to="/circulation"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Empréstimo & Devolução</span>
              </NavLink>
              <NavLink
                to="/circulation/fines"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Receipt className="w-4 h-4" />
                <span>Multas & Pendências</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Módulo Usuários */}
        {hasPermission('users.view') && (
          <div className="pt-2">
            <button
              onClick={() => setOpenUsers(!openUsers)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <span>Usuários & Equipe</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openUsers ? 'rotate-180' : ''}`} />
            </button>
            {openUsers && (
              <div className="mt-1 space-y-1 pl-2 border-l border-slate-800 ml-3">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                      isActive ? 'bg-brand-600/20 text-brand-300 font-medium' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  <Users className="w-4 h-4" />
                  <span>Gerenciar Usuários</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Módulo Unidades & Bibliotecas */}
        <NavLink
          to="/libraries"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span>Unidades / Bibliotecas</span>
        </NavLink>

        {/* Periódicos */}
        <NavLink
          to="/serials"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <Newspaper className="w-5 h-5 text-amber-400" />
          <span>Periódicos</span>
        </NavLink>

        {/* Aquisição & Descarte */}
        <NavLink
          to="/acquisitions"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <span>Aquisições & Descartes</span>
        </NavLink>

        {/* Inventário */}
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <ClipboardList className="w-5 h-5 text-purple-400" />
          <span>Inventário</span>
        </NavLink>

        {/* Relatórios */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <BarChart3 className="w-5 h-5 text-rose-400" />
          <span>Relatórios & KPIs</span>
        </NavLink>

        {/* Banco de Dados & Backup */}
        <NavLink
          to="/database"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`
          }
        >
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Banco de Dados & Backup</span>
        </NavLink>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>BiblioGest v1.0</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema Operacional" />
      </div>
    </aside>
  );
};
