import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Library } from '../../types';
import { Building2, Plus, Phone, Mail, Clock } from 'lucide-react';

export const LibraryListPage: React.FC = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/libraries')
      .then((res) => setLibraries(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-500" />
            <span>Unidades & Bibliotecas da Rede</span>
          </h1>
          <p className="text-xs text-slate-500">Gestão de unidades centrais e campi setoriais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {libraries.map((lib) => (
          <div key={lib.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-950 px-2 py-0.5 rounded">
                  {lib.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{lib.name}</h3>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${lib.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div>{lib.address} — {lib.city}/{lib.state}</div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-brand-500" />
                <span>{lib.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>{lib.email || 'Sem e-mail'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{lib.openingHours || 'Seg-Sex 08:00 - 18:00'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
