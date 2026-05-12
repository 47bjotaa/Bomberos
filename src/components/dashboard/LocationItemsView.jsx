import React from 'react';

function LocationItemsView({ locationName, items, subUbicaciones = [], loading, onClose }) {
  // Mapping categories to specific icons (SVG)
  const getIcon = (iconType) => {
    switch (iconType) {
      case 'radio':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'medical':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'fire':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14a4.5 4.5 0 005.25 7.424" />
          </svg>
        );
      case 'folder':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface border-l border-dark-border shadow-2xl animate-slide-in-right w-full max-w-md">
      {/* Header Panel */}
      <div className="p-6 border-b border-dark-border bg-dark-bg/40">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan border border-brand-cyan/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white rajdhani tracking-wide">{locationName}</h3>
              <p className="text-xs text-text-muted mt-0.5">Gestión de inventario y compartimientos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-bg3 text-text-muted hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-8 h-8 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-text-muted rajdhani text-center px-6">Consultando servidores de Synetix...</p>
          </div>
        ) : (
          <>
            {/* Sub-Locations Section */}
            {subUbicaciones.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_5px_rgba(56,189,248,0.5)]"></div>
                  Subdivisiones / Gavetas
                </h4>
                <div className="space-y-2">
                  {subUbicaciones.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/40 border border-dark-border hover:border-brand-cyan/20 transition-all cursor-pointer group">
                      <div className="text-text-muted group-hover:text-brand-cyan">
                        {getIcon('folder')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-text-main font-medium truncate">{sub.nombre}</span>
                      </div>
                      <svg className="w-4 h-4 text-text-muted group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Section */}
            <div>
              <h4 className="text-xs font-bold text-brand-red uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red shadow-[0_0_5px_rgba(232,55,42,0.5)]"></div>
                Materiales en {locationName}
              </h4>
              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-dark-bg/40 border border-dark-border hover:border-brand-cyan/30 hover:bg-dark-bg/60 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-dark-bg2 flex items-center justify-center text-text-muted group-hover:text-brand-cyan transition-colors border border-dark-border group-hover:border-brand-cyan/20">
                        {getIcon(item.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-cyan transition-colors">{item.nombre}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-bg3 text-text-muted border border-dark-border">{item.categoria}</span>
                          {item.codigo && <span className="text-[10px] text-brand-cyan/70 font-mono">#{item.codigo}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-brand-cyan bg-brand-cyan/5 px-2 py-0.5 rounded border border-brand-cyan/10">
                          x{item.cantidad}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-dark-border rounded-2xl opacity-40">
                    <p className="text-sm text-text-muted">Sin materiales directos.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Footer Action */}
      {!loading && (
        <div className="p-4 border-t border-dark-border bg-dark-bg/60">
          <button className="w-full py-3 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan text-sm font-bold rounded-xl border border-brand-cyan/20 transition-all shadow-[0_0_15px_rgba(56,189,248,0.05)]">
            + Asignar Nuevo Material
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationItemsView;
