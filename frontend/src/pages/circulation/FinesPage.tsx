import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Fine } from '../../types';
import { Receipt, CheckCircle, XCircle } from 'lucide-react';

export const FinesPage: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = () => {
    setLoading(true);
    api.get('/fines')
      .then((res) => setFines(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePay = async (id: string) => {
    if (!window.confirm('Confirmar o recebimento do pagamento desta multa?')) return;
    try {
      await api.post(`/fines/${id}/pay`);
      fetchFines();
    } catch (err) {
      alert('Erro ao quitar multa.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Confirmar o cancelamento desta multa?')) return;
    try {
      await api.post(`/fines/${id}/cancel`);
      fetchFines();
    } catch (err) {
      alert('Erro ao cancelar multa.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="w-6 h-6 text-brand-500" />
          <span>Gestão de Multas & Pendências Financeiras</span>
        </h1>
        <p className="text-xs text-slate-500">Controle de débitos por devoluções em atraso</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-3">Usuário</th>
                <th className="p-3">Motivo / Exemplar</th>
                <th className="p-3">Valor (R$)</th>
                <th className="p-3">Data Emissão</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Carregando multas...</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Nenhuma multa pendente no sistema.</td></tr>
              ) : (
                fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold">{f.user?.name}</td>
                    <td className="p-3">{f.reason || '-'}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">R$ {f.amount.toFixed(2)}</td>
                    <td className="p-3">{new Date(f.issuedAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${f.status === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : f.status === 'PAGO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {f.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handlePay(f.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                          >
                            Quitar Pagamento
                          </button>
                          <button
                            onClick={() => handleCancel(f.id)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-[11px]"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
