import React, { useState } from 'react';
import { api } from '../../services/api';
import { ClipboardList, Barcode, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [sessionId, setSessionId] = useState('INV-2026-01');
  const [barcode, setBarcode] = useState('');
  const [scans, setScans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    try {
      const res = await api.post('/inventory/scan', {
        sessionId,
        libraryId: '1',
        barcode,
      });
      setScans([res.data, ...scans]);
      setBarcode('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-500" />
          <span>Módulo de Inventário & Auditoria de Acervo</span>
        </h1>
        <p className="text-xs text-slate-500">Conferência física de estantes por leitura de código de barras</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl space-y-4">
        <form onSubmit={handleScan} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ID da Sessão de Inventário</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bipar Código de Barras do Item na Estante</label>
            <div className="relative">
              <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Leitor bipador..."
                className="w-full bg-slate-50 dark:bg-slate-900 border rounded pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-purple-600"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-sm">
            Registrar Leitura
          </button>
        </form>
      </div>

      {/* Scans List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-semibold">
            <tr>
              <th className="p-3">Barcode Bipado</th>
              <th className="p-3">Obra / Título</th>
              <th className="p-3">Resultado Auditoria</th>
              <th className="p-3">Hora da Leitura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {scans.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="p-3 font-mono font-bold">{s.scan?.barcodeScanned}</td>
                <td className="p-3 font-bold">{s.item?.biblio?.title || 'Não cadastrado'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-bold ${s.statusFound === 'ENCONTRADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {s.statusFound}
                  </span>
                </td>
                <td className="p-3">{new Date(s.scan?.scannedAt).toLocaleTimeString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
