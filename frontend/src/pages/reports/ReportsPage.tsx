import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [overdues, setOverdues] = useState<any[]>([]);

  useEffect(() => {
    api.get('/reports/overdue').then((res) => setOverdues(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-rose-500" />
            <span>Relatórios & Estatísticas da Biblioteca</span>
          </h1>
          <p className="text-xs text-slate-500">Relatórios gerenciais, atrasos, inventário e circulação</p>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Exportar PDF</span>
          </button>
          <button className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          Relatório de Devoluções Pendentes em Atraso
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-3">Usuário</th>
                <th className="p-3">Contato / E-mail</th>
                <th className="p-3">Obra Bibliográfica</th>
                <th className="p-3">Data Vencimento</th>
                <th className="p-3">Biblioteca Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {overdues.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{o.user?.name}</td>
                  <td className="p-3">{o.user?.email} ({o.user?.phone || 'Sem tel'})</td>
                  <td className="p-3">{o.item?.biblio?.title}</td>
                  <td className="p-3 font-bold text-rose-600">{new Date(o.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">{o.item?.library?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
