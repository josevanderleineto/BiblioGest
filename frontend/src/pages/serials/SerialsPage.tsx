import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Newspaper } from 'lucide-react';

export const SerialsPage: React.FC = () => {
  const [serials, setSerials] = useState<any[]>([]);

  useEffect(() => {
    api.get('/serials').then((res) => setSerials(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-brand-500" />
          <span>Gestão de Periódicos & Fascículos</span>
        </h1>
        <p className="text-xs text-slate-500">Kardex de controle de revistas, jornais e publicações seriadas</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
            <tr>
              <th className="p-3">ISSN</th>
              <th className="p-3">Título do Periódico</th>
              <th className="p-3">Editora</th>
              <th className="p-3">Periodicidade</th>
              <th className="p-3">Fascículos Registrados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {serials.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="p-3 font-mono font-bold text-brand-600">{s.issn}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{s.title}</td>
                <td className="p-3">{s.publisher || '-'}</td>
                <td className="p-3">{s.frequency || 'Mensal'}</td>
                <td className="p-3 font-bold">{s.issues?.length || 0} fascículo(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
