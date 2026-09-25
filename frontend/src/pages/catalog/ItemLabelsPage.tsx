import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { api } from '../../services/api';
import { Item } from '../../types';
import { BookOpen, Printer, Tag } from 'lucide-react';

const ItemBarcode: React.FC<{ value: string }> = ({ value }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    JsBarcode(svgRef.current, value, { format: 'CODE128', displayValue: false, margin: 0, width: 1.35, height: 38 });
  }, [value]);

  return <div className="barcode-block"><svg ref={svgRef} className="barcode-svg" role="img" aria-label={`Código de barras ${value}`} /><span className="barcode-value">{value}</span></div>;
};

function callNumberLines(item: Item) {
  return (item.callNumber || item.biblio?.callNumber || 'Sem chamada').split(/\s+/).filter(Boolean);
}

function authorLine(item: Item) {
  return item.biblio?.authors?.split(',')[0]?.trim() || 'Autor não informado';
}

export const ItemLabelsPage: React.FC = () => {
  const [params] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [printCopies, setPrintCopies] = useState(true);
  const [printSpines, setPrintSpines] = useState(true);

  useEffect(() => {
    const biblioId = params.get('biblioId');
    if (!biblioId) { setLoading(false); return; }
    api.get(`/items/labels?biblioId=${encodeURIComponent(biblioId)}`)
      .then((res) => { setItems(res.data); setSelected(res.data.map((item: Item) => item.id)); })
      .finally(() => setLoading(false));
  }, [params]);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  const printed = items.filter((item) => selected.includes(item.id));
  const canPrint = printed.length > 0 && (printCopies || printSpines);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="screen-only flex flex-col sm:flex-row justify-between gap-4"><div><h1 className="text-xl font-extrabold tracking-tight flex gap-2 items-center"><Tag className="w-6 h-6 text-brand-500" />Etiquetas dos exemplares</h1><p className="text-xs text-slate-500">Etiqueta de exemplar em Code 128 e lombada com número de chamada.</p></div><button onClick={() => window.print()} disabled={!canPrint} className="px-5 py-2.5 bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir</button></div>

      {loading ? <div className="text-center text-slate-500 py-10">Carregando exemplares...</div> : !items.length ? <div className="screen-only p-6 bg-amber-50 text-amber-800 rounded-xl">Não há exemplares para esta obra.</div> : <>
        <div className="screen-only bg-white dark:bg-slate-800 rounded-xl border p-4 space-y-3"><div className="flex flex-wrap gap-5 text-sm font-medium"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={printCopies} onChange={(e) => setPrintCopies(e.target.checked)} />Etiqueta do exemplar</label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={printSpines} onChange={(e) => setPrintSpines(e.target.checked)} />Etiqueta de lombada</label></div><div className="space-y-2">{items.map((item) => <label key={item.id} className="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /><span className="font-semibold">{item.tombo}</span><span className="font-mono">{item.barcode}</span><span className="text-slate-500">{item.library?.name}</span></label>)}</div></div>

        <div className="print-area">
          {printCopies && <section className="copy-sheet"><h2 className="print-section-title">Etiquetas de exemplar</h2><div className="copy-grid">{printed.map((item) => <article key={`copy-${item.id}`} className="copy-label"><div className="copy-header"><strong>N.Cham.: {item.callNumber || item.biblio?.callNumber || 'Sem chamada'}</strong><span>{item.library?.code || 'BIB'}</span></div><div className="copy-text"><span>Autor: {authorLine(item)}</span><span>Título: {item.biblio?.title || 'Obra bibliográfica'}</span></div><ItemBarcode value={item.barcode} /><div className="copy-footer"><span>{item.tombo}</span><span>{item.library?.code || 'BIB'}</span></div></article>)}</div></section>}
          {printSpines && <section className="spine-sheet"><h2 className="print-section-title">Etiquetas de lombada</h2><div className="spine-grid">{printed.map((item) => <article key={`spine-${item.id}`} className="spine-label"><BookOpen className="spine-icon" aria-hidden="true" /><div className="spine-call">{callNumberLines(item).map((line, index) => <span key={`${item.id}-${index}`}>{line}</span>)}</div><span className="spine-tombo">Ex. {item.tombo}</span></article>)}</div></section>}
        </div>
      </>}

      <style>{`
        .print-area { color:#000; } .print-section-title { font-size:14px; font-weight:700; margin:0 0 8px; } .copy-sheet, .spine-sheet { margin-top:20px; }
        .copy-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(82mm,1fr)); gap:8mm; } .copy-label { width:82mm; min-height:42mm; border:1px solid #000; padding:3mm; display:flex; flex-direction:column; break-inside:avoid; background:#fff; font:10pt Arial,sans-serif; } .copy-header { display:flex; justify-content:space-between; gap:4mm; font-size:10pt; } .copy-text { display:flex; flex-direction:column; min-height:11mm; margin:1.5mm 0; overflow:hidden; line-height:1.2; } .barcode-block { margin-top:auto; text-align:center; } .barcode-svg { display:block; width:100%; height:12mm; } .barcode-value { display:block; font:8pt monospace; letter-spacing:.8px; margin-top:.5mm; } .copy-footer { display:flex; justify-content:space-between; font:8pt monospace; margin-top:1mm; }
        .spine-grid { display:grid; grid-template-columns:repeat(auto-fill,24mm); gap:5mm; } .spine-label { width:24mm; min-height:70mm; border:1px solid #000; padding:3mm 2mm; display:flex; flex-direction:column; align-items:center; break-inside:avoid; background:#fff; } .spine-icon { width:10px; height:10px; margin-bottom:2mm; } .spine-call { display:flex; flex-direction:column; align-items:center; font:700 12pt Georgia,serif; line-height:1.18; text-align:center; word-break:break-word; } .spine-tombo { margin-top:auto; font:7pt Arial,sans-serif; text-align:center; }
        @media print { @page { size:A4; margin:8mm; } .screen-only { display:none !important; } body { background:#fff !important; } .print-area { width:auto; } .copy-sheet, .spine-sheet { margin-top:0; break-after:page; } .spine-sheet:last-child { break-after:auto; } .print-section-title { display:none; } .copy-grid { grid-template-columns:repeat(2,82mm); gap:6mm; } .spine-grid { grid-template-columns:repeat(7,24mm); gap:4mm; } }
      `}</style>
    </div>
  );
};
