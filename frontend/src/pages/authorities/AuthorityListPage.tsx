import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Award, Plus, Search } from 'lucide-react';

export const AuthorityListPage: React.FC = () => {
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/authorities')
      .then((res) => setAuthorities(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-brand-500" />
          <span>Controle de Autoridades Bibliográficas</span>
        </h1>
        <p className="text-xs text-slate-500">Pessoas, Entidades, Eventos, Assuntos e Títulos Uniformes</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Cabeçalho Autorizado</th>
              <th className="p-3">Remissivas (Ver Também)</th>
              <th className="p-3">Notas de Aplicação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-slate-400">Carregando autoridades...</td></tr>
            ) : authorities.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="p-3">
                  <span className="font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {a.type}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{a.heading}</td>
                <td className="p-3 text-slate-500">{a.seeAlso || '-'}</td>
                <td className="p-3 text-slate-500">{a.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
