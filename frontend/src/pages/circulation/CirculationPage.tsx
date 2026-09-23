import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Loan } from '../../types';
import { ArrowRightLeft, CheckCircle2, RotateCcw, Barcode, UserCheck, AlertTriangle, Receipt } from 'lucide-react';

export const CirculationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'return' | 'loans'>('checkout');

  // Checkout state
  const [regNum, setRegNum] = useState('');
  const [checkoutBarcode, setCheckoutBarcode] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const checkoutBarcodeRef = useRef<HTMLInputElement>(null);
  const returnBarcodeRef = useRef<HTMLInputElement>(null);

  // Return state
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnMsg, setReturnMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);

  // Loans list
  const [loans, setLoans] = useState<Loan[]>([]);

  const fetchLoans = () => {
    api.get('/circulation/loans').then((res) => setLoans(res.data));
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutMsg(null);
    setCheckoutLoading(true);

    try {
      const res = await api.post('/circulation/checkout', {
        registrationNumber: regNum.trim(),
        barcode: checkoutBarcode.trim(),
      });
      setCheckoutMsg({
        type: 'success',
        text: `✓ Empréstimo realizado com sucesso! Vencimento: ${new Date(res.data.dueDate).toLocaleDateString('pt-BR')}`,
      });
      setCheckoutBarcode('');
      checkoutBarcodeRef.current?.focus();
      fetchLoans();
    } catch (err: any) {
      setCheckoutMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erro ao realizar empréstimo.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnMsg(null);
    setReturnLoading(true);

    try {
      const res = await api.post('/circulation/return', {
        barcode: returnBarcode.trim(),
      });
      setReturnMsg({
        type: 'success',
        text: `✓ Devolução registrada com sucesso!`,
        details: res.data,
      });
      setReturnBarcode('');
      returnBarcodeRef.current?.focus();
      fetchLoans();
    } catch (err: any) {
      setReturnMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erro ao registrar devolução.',
      });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleRenew = async (loanId: string) => {
    try {
      const res = await api.post(`/circulation/renew/${loanId}`);
      alert(`Empréstimo renovado! Novo vencimento: ${new Date(res.data.newDueDate).toLocaleDateString('pt-BR')}`);
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao renovar empréstimo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-brand-500" />
          <span>Módulo de Circulação</span>
        </h1>
        <p className="text-xs text-slate-500">Empréstimos, devoluções, renovações e leitor de código de barras</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveTab('checkout'); setTimeout(() => checkoutBarcodeRef.current?.focus(), 0); }}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'checkout'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Realizar Empréstimo
        </button>
        <button
          onClick={() => { setActiveTab('return'); setTimeout(() => returnBarcodeRef.current?.focus(), 0); }}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'return'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Devolução Rápida (Barcode)
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'loans'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Empréstimos Ativos ({loans.length})
        </button>
      </div>

      {/* Checkout Tab */}
      {activeTab === 'checkout' && (
        <div className="max-w-xl bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span>Formulário de Empréstimo</span>
          </h2>

          {checkoutMsg && (
            <div
              className={`p-4 rounded-xl text-sm font-medium ${
                checkoutMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {checkoutMsg.text}
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Matrícula, CPF ou usuário do leitor
              </label>
              <input
                type="text"
                required
                autoFocus
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); checkoutBarcodeRef.current?.focus(); }
                }}
                placeholder="Ex: 202410050"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Código de Barras do Exemplar (Leitor Bipador)
              </label>
              <div className="relative">
                <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  ref={checkoutBarcodeRef}
                  value={checkoutBarcode}
                  onChange={(e) => setCheckoutBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    // Leitores USB enviam o código como teclado e finalizam com Enter.
                    if (e.key === 'Enter' && regNum.trim() && checkoutBarcode.trim()) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement)?.requestSubmit(); }
                  }}
                  placeholder="Ex: 100001"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm dark:text-white font-mono font-bold text-brand-600 dark:text-brand-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={checkoutLoading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
            >
              {checkoutLoading ? 'Processando Empréstimo...' : 'Confirmar Empréstimo'}
            </button>
          </form>
        </div>
      )}

      {/* Return Tab */}
      {activeTab === 'return' && (
        <div className="max-w-xl bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-500" />
            <span>Devolução Rápida por Código de Barras</span>
          </h2>

          {returnMsg && (
            <div
              className={`p-4 rounded-xl text-sm font-medium space-y-1 ${
                returnMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              <div>{returnMsg.text}</div>
              {returnMsg.details?.fineGenerated > 0 && (
                <div className="font-bold text-rose-600">
                  Multa gerada por atraso ({returnMsg.details.overdueDays} dias): R$ {returnMsg.details.fineGenerated.toFixed(2)}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Bipar ou digitar código de barras do exemplar
              </label>
              <div className="relative">
                <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  ref={returnBarcodeRef}
                  value={returnBarcode}
                  onChange={(e) => setReturnBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && returnBarcode.trim()) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement)?.requestSubmit(); }
                  }}
                  placeholder="Ex: 100001"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm dark:text-white font-mono font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={returnLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
            >
              {returnLoading ? 'Registrando Devolução...' : 'Devolver Exemplar'}
            </button>
          </form>
        </div>
      )}

      {/* Loans List Tab */}
      {activeTab === 'loans' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Obra Bibliográfica</th>
                  <th className="p-3">Barcode</th>
                  <th className="p-3">Data Empréstimo</th>
                  <th className="p-3">Vencimento</th>
                  <th className="p-3">Renovações</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold">{l.user?.name}</td>
                    <td className="p-3">{l.item?.biblio?.title}</td>
                    <td className="p-3 font-mono text-brand-600">{l.item?.barcode}</td>
                    <td className="p-3">{new Date(l.checkoutDate).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-bold">{new Date(l.dueDate).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{l.renewalCount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${l.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRenew(l.id)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-brand-500 hover:text-white text-slate-700 dark:text-slate-200 rounded font-semibold transition-colors"
                      >
                        Renovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
