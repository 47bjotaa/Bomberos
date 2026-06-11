import { useEffect, useRef, useState } from 'react';

function ModuleHelp({ title = 'Ayuda del modulo', items = [], align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!items.length) return null;

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-label={title}
        title={title}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50"
      >
        <span className="rajdhani text-xl font-bold leading-none">?</span>
      </button>
      {open && (
        <div
          className={`absolute top-11 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-dark-border bg-dark-surface p-4 text-left shadow-2xl shadow-black/35 ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="rajdhani text-base font-bold text-text-main">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar ayuda"
              className="rounded-md px-2 py-0.5 text-lg leading-none text-text-muted transition-colors hover:bg-dark-bg3 hover:text-text-main"
            >
              x
            </button>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-text-muted">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ModuleHelp;
