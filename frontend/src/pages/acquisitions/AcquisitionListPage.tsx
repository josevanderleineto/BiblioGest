import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShoppingCart } from 'lucide-react';

export const AcquisitionListPage: React.FC = () => {
  const [acquisitions, setAcquisitions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/acquisitions').then((res) => setAcquisitions(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-brand-500" />
          <span>Módulo de Aquisição & Fornecedores</span>
        </h1>
        <p className="text-xs text-slate-500">Compras, doações, notas ficais e fornecedores</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
            <tr>
              <th className="p-3">Título / Obra</th>
              <th className="p-3">Tipo Aquisição</th>
              <th className="p-3">Fornecedor</th>
              <th className="p-3">Qtd</th>
              <th className="p-3">Valor Total (R$)</th>
              <th className="p-3">Nota Fiscal</th>
              <th className="p-3">Data Recebimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {acquisitions.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="p-3 font-bold text-slate-900 dark:text-white">{a.title}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                    {a.acquisitionType}
                  </span>
                </td>
                <td className="p-3">{a.supplier || '-'}</td>
                <td className="p-3 font-bold">{a.quantity}</td>
                <td className="p-3 font-bold text-emerald-600">R$ {(a.totalValue || 0).toFixed(2)}</td>
                <td className="p-3 font-mono">{a.invoiceNumber || '-'}</td>
                <td className="p-3">{new Date(a.receivedDate).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
