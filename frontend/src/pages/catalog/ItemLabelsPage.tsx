import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Item } from '../../types';
import { Printer, Tag } from 'lucide-react';

const code39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', '*': 'nwnnwnwnn',
};

const Barcode: React.FC<{ value: string }> = ({ value }) => {
  const source = `*${value.replace(/[^0-9]/g, '') || '0'}*`;
  let x = 8;
  const bars: React.ReactNode[] = [];
  source.split('').forEach((character, characterIndex) => {
    (code39[character] || code39['0']).split('').forEach((widthCode, index) => {
      const width = widthCode === 'w' ? 3 : 1;
      if (index % 2 === 0) bars.push(<rect key={`${characterIndex}-${index}`} x={x} y="2" width={width} height="36" fill="black" />);
      x += width;
    });
    x += 1;
  });
  return <svg className="barcode-svg" viewBox={`0 0 ${x + 8} 40`} role="img" aria-label={`Código de barras ${value}`} preserveAspectRatio="none">{bars}</svg>;
};

export const ItemLabelsPage: React.FC = () => {
  const [params] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const biblioId = params.get('biblioId');
    if (!biblioId) { setLoading(false); return; }
    api.get(`/items/labels?biblioId=${encodeURIComponent(biblioId)}`)
      .then((res) => { setItems(res.data); setSelected(res.data.map((item: Item) => item.id)); })
      .finally(() => setLoading(false));
  }, [params]);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  const printed = items.filter((item) => selected.includes(item.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="no-print flex flex-col sm:flex-row justify-between gap-4"><div><h1 className="text-xl font-extrabold tracking-tight flex gap-2 items-center"><Tag className="w-6 h-6 text-brand-500" />Etiquetas dos exemplares</h1><p className="text-xs text-slate-500">Selecione os exemplares e imprima em papel para etiquetas.</p></div><button onClick={() => window.print()} disabled={!printed.length} className="px-5 py-2.5 bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir {printed.length} etiqueta(s)</button></div>
      {loading ? <div className="text-center text-slate-500 py-10">Carregando exemplares...</div> : !items.length ? <div className="p-6 bg-amber-50 text-amber-800 rounded-xl">Não há exemplares para esta obra.</div> : <><div className="no-print bg-white dark:bg-slate-800 rounded-xl border p-4 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /><span className="font-semibold">{item.tombo}</span><span>{item.barcode}</span><span className="text-slate-500">{item.library?.name}</span></label>)}</div><div className="label-sheet">{printed.map((item) => <article key={item.id} className="item-label"><strong>{item.library?.name || 'Biblioteca'}</strong><span className="label-title">{item.biblio?.title || 'Obra bibliográfica'}</span><span className="label-call">{item.callNumber || item.biblio?.callNumber || 'Sem chamada'}</span><Barcode value={item.barcode} /><span className="label-code">Tombo: {item.tombo} · {item.barcode}</span></article>)}</div></>}
      <style>{`@media print { .no-print { display:none !important; } body { background:#fff; } .label-sheet { padding:0; } } .label-sheet { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:10px; } .item-label { border:1px solid #111; min-height:120px; padding:10px; display:flex; flex-direction:column; color:#111; background:#fff; font-size:11px; break-inside:avoid; } .label-title { font-weight:700; margin-top:7px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; } .label-call { font:700 14px monospace; margin:7px 0; } .barcode-svg { width:100%; height:36px; border-top:1px solid #ddd; padding-top:4px; } .label-code { font-size:9px; text-align:center; }`}</style>
    </div>
  );
};
