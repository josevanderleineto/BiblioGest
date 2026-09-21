import React from 'react';
import { MarcField, MarcSubfield } from '../types';
import { Plus, Trash2, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateMarcRecord } from '../utils/marc21';


interface Marc21EditorProps {
  fields: MarcField[];
  onChange: (fields: MarcField[]) => void;
}

export const Marc21Editor: React.FC<Marc21EditorProps> = ({ fields, onChange }) => {
  const handleTagChange = (index: number, newTag: string) => {
    const updated = [...fields];
    updated[index].tag = newTag;
    onChange(updated);
  };

  const handleIndChange = (index: number, indNum: 1 | 2, val: string) => {
    const updated = [...fields];
    if (indNum === 1) updated[index].ind1 = val;
    else updated[index].ind2 = val;
    onChange(updated);
  };

  const handleSubfieldChange = (fieldIdx: number, subIdx: number, key: 'code' | 'value', val: string) => {
    const updated = [...fields];
    updated[fieldIdx].subfields[subIdx][key] = val;
    onChange(updated);
  };

  const addSubfield = (fieldIdx: number) => {
    const updated = [...fields];
    updated[fieldIdx].subfields.push({ code: 'a', value: '' });
    onChange(updated);
  };

  const removeSubfield = (fieldIdx: number, subIdx: number) => {
    const updated = [...fields];
    updated[fieldIdx].subfields.splice(subIdx, 1);
    onChange(updated);
  };

  const addField = () => {
    const updated = [...fields, { tag: '500', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '' }] }];
    onChange(updated);
  };

  const duplicateField = (fieldIdx: number) => {
    const target = fields[fieldIdx];
    const copy: MarcField = {
      tag: target.tag,
      ind1: target.ind1,
      ind2: target.ind2,
      subfields: target.subfields.map((s) => ({ ...s })),
    };
    const updated = [...fields];
    updated.splice(fieldIdx + 1, 0, copy);
    onChange(updated);
  };

  const removeField = (fieldIdx: number) => {
    const updated = [...fields];
    updated.splice(fieldIdx, 1);
    onChange(updated);
  };

  const validation = validateMarcRecord(fields);

  return (
    <div className="space-y-4">
      {/* Validation status badge */}
      <div className={`p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${validation.valid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'}`}>
        {validation.valid ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Registro MARC21 bibliográfico VÁLIDO.</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">Atenção na validação MARC21:</span>
              <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* MARC21 Field Rows */}
      <div className="space-y-3">
        {fields.map((field, fieldIdx) => (
          <div
            key={fieldIdx}
            className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 hover:border-brand-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Tag (3 digits) */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">TAG</span>
                <input
                  type="text"
                  maxLength={3}
                  value={field.tag}
                  onChange={(e) => handleTagChange(fieldIdx, e.target.value)}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-brand-600 dark:text-brand-400 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">IND1</span>
                <input
                  type="text"
                  maxLength={1}
                  value={field.ind1 || ' '}
                  onChange={(e) => handleIndChange(fieldIdx, 1, e.target.value)}
                  className="w-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-center font-mono text-xs"
                />
                <span className="text-xs text-slate-400">IND2</span>
                <input
                  type="text"
                  maxLength={1}
                  value={field.ind2 || ' '}
                  onChange={(e) => handleIndChange(fieldIdx, 2, e.target.value)}
                  className="w-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-center font-mono text-xs"
                />
              </div>

              <div className="flex-1" />

              {/* Action buttons */}
              <button
                type="button"
                onClick={() => addSubfield(fieldIdx)}
                className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white px-2 py-1 rounded transition-colors"
                title="Adicionar Subcampo"
              >
                + Subcampo
              </button>
              <button
                type="button"
                onClick={() => duplicateField(fieldIdx)}
                className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                title="Duplicar Campo MARC"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeField(fieldIdx)}
                className="p-1 text-slate-400 hover:text-rose-600"
                title="Excluir Campo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Subfields Inputs */}
            <div className="space-y-1.5 pl-4 border-l-2 border-brand-500/30">
              {field.subfields.map((sub, subIdx) => (
                <div key={subIdx} className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-500">$</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={sub.code}
                    onChange={(e) => handleSubfieldChange(fieldIdx, subIdx, 'code', e.target.value)}
                    className="w-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-center font-mono text-xs font-semibold text-amber-600 dark:text-amber-400"
                  />
                  <input
                    type="text"
                    value={sub.value}
                    onChange={(e) => handleSubfieldChange(fieldIdx, subIdx, 'value', e.target.value)}
                    placeholder="Valor do subcampo..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-slate-200 focus:ring-1 focus:ring-brand-500"
                  />
                  {field.subfields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubfield(fieldIdx, subIdx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addField}
        className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-600 dark:text-slate-300 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Adicionar Novo Campo MARC21</span>
      </button>
    </div>
  );
};
