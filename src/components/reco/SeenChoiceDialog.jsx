import React from 'react';
import { FGlyph } from '../illustrations/NotoBadges';

// Diálogo ligero tras pulsar "Vista ✓ / Ya fui ✓": ¿se queda en favoritos
// (consumida, con repesca al mes) o va a la papelera (veto + repuesto)?
export default function SeenChoiceDialog({ title, verb, onKeep, onDiscard, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-8"
      role="dialog"
      aria-modal="true"
      aria-label={`¿Qué hacemos con ${title}?`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-conn-deep/50" />
      <div
        className="relative bg-white rounded-3xl p-5 w-full max-w-sm space-y-4"
        style={{ boxShadow: '0 20px 50px -12px rgba(11, 59, 66, 0.45)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-[10px] font-black text-conn-muted uppercase tracking-widest">{verb}</p>
          <h3 className="font-theme-title text-[16px] font-black text-conn-deep leading-snug mt-0.5">{title}</h3>
          <p className="text-xs font-semibold text-conn-muted mt-2 leading-relaxed">
            ¿Lo guardamos en favoritos o lo enviamos a la papelera? Si lo guardas, dentro de un mes
            te preguntaremos si quieres repetir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-bold text-conn-muted bg-conn-aqua hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
          >
            <FGlyph name="x" size={16} />
            Papelera
          </button>
          <button
            type="button"
            onClick={onKeep}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-black bg-conn-teal text-white active:scale-95 transition-all min-h-[44px]"
          >
            <FGlyph name="corazon" size={16} />
            Guardar en favoritos
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs font-bold text-conn-muted/70 min-h-[36px]"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
