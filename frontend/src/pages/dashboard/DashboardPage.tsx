import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { Users, BookOpen, Layers, ArrowRightLeft, AlertTriangle, Receipt, Bookmark, PlusCircle, Database, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Carregando estatísticas do dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Painel de Controle — BiblioGest</h1>
          <p className="text-brand-100 text-sm mt-1">
            Sistema integrado de automação bibliotecária, circulação e catalogação MARC21 / RDA.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Obras */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Obras Catalogadas</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.totalBiblios || 0}</div>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Exemplares Disponíveis */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exemplares no Acervo</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats?.availableItems || 0} <span className="text-xs font-normal text-slate-500">/ {stats?.totalItems || 0}</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Empréstimos Ativos */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empréstimos Ativos</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.activeLoans || 0}</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Atrasados */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Devoluções em Atraso</span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats?.overdueLoans || 0}</div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">Atalhos Operacionais Rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/circulation')}
            className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3"
          >
            <ArrowRightLeft className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold">Realizar Empréstimo / Devolução</span>
          </button>

          <button
            onClick={() => navigate('/catalog/new')}
            className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3"
          >
            <PlusCircle className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold">Nova Catalogação MARC21</span>
          </button>

          <button
            onClick={() => navigate('/users')}
            className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3"
          >
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold">Cadastrar Novo Usuário</span>
          </button>

          <button
            onClick={() => navigate('/database')}
            className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3"
          >
            <Database className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-bold">Backup do Banco de Dados</span>
          </button>
        </div>
      </div>

      {/* Recent Loans Activity */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">Últimos Empréstimos Registrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-2.5">Usuário</th>
                <th className="p-2.5">Obra</th>
                <th className="p-2.5">Exemplar (Barcode)</th>
                <th className="p-2.5">Data Empréstimo</th>
                <th className="p-2.5">Data Vencimento</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {stats?.recentLoans?.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="p-2.5 font-bold">{loan.user?.name}</td>
                  <td className="p-2.5">{loan.item?.biblio?.title}</td>
                  <td className="p-2.5 font-mono text-brand-600">{loan.item?.barcode}</td>
                  <td className="p-2.5">{new Date(loan.checkoutDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2.5">{new Date(loan.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded font-bold ${loan.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
