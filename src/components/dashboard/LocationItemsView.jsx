function LocationItemsView({ locationName, items, loading, hasSelection, onAddMaterial, addMaterialDisabledReason = '' }) {
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
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  return (
    <section className="flex h-full w-full flex-col border-r border-dark-border bg-dark-surface shadow-xl">
      <div className="flex-shrink-0 border-b border-dark-border bg-dark-bg/40 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 p-2 text-brand-cyan">
            {getIcon('package')}
          </div>
          <div>
            <h3 className="rajdhani text-xl font-bold tracking-wide text-white">Materiales</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              {hasSelection ? `Contenido de ${locationName}` : 'Selecciona una ubicacion para cargar su inventario'}
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {!hasSelection ? (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-border bg-dark-bg/30 px-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dark-border bg-dark-bg2 text-text-muted">
              {getIcon('package')}
            </div>
            <p className="rajdhani text-lg font-semibold text-white">Sin ubicacion seleccionada</p>
            <p className="mt-2 max-w-sm text-sm text-text-muted">El inventario aparecera aqui cuando abras una ubicacion del panel derecho.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan"></div>
            <p className="rajdhani px-6 text-center text-sm text-text-muted">Sincronizando con el cuartel...</p>
          </div>
        ) : (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-red">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red shadow-[0_0_5px_rgba(232,55,42,0.5)]"></span>
              Materiales en {locationName}
            </h4>
            <div className="space-y-3">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={`${item.id}-${item.codigo || item.nombre}`}
                    className="group flex items-center gap-4 rounded-xl border border-dark-border bg-dark-bg/40 p-4 transition-all hover:border-brand-cyan/30 hover:bg-dark-bg/60"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dark-border bg-dark-bg2 text-text-muted transition-colors group-hover:border-brand-cyan/20 group-hover:text-brand-cyan">
                      {getIcon(item.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">{item.nombre}</h4>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded border border-dark-border bg-dark-bg3 px-1.5 py-0.5 text-[10px] text-text-muted">{item.categoria}</span>
                        {item.codigo && <span className="font-mono text-[10px] text-brand-cyan/70">#{item.codigo}</span>}
                      </div>
                    </div>
                    <span className="rounded border border-brand-cyan/10 bg-brand-cyan/5 px-2 py-0.5 font-mono text-sm text-brand-cyan">
                      x{item.cantidad}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-dark-border py-10 text-center opacity-50">
                  <p className="text-sm text-text-muted">Sin materiales directos.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {hasSelection && !loading && (
        <div className="flex-shrink-0 border-t border-dark-border bg-dark-bg/60 p-4">
          {addMaterialDisabledReason && (
            <p className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
              {addMaterialDisabledReason}
            </p>
          )}
          <button
            onClick={onAddMaterial}
            disabled={Boolean(addMaterialDisabledReason)}
            title={addMaterialDisabledReason || 'Añadir material'}
            className="w-full rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 py-3 text-sm font-bold text-brand-cyan shadow-[0_0_15px_rgba(56,189,248,0.05)] transition-all hover:bg-brand-cyan/20 disabled:cursor-not-allowed disabled:border-dark-border disabled:bg-dark-bg3 disabled:text-text-muted disabled:shadow-none"
          >
            + Añadir material
          </button>
        </div>
      )}
    </section>
  );
}

export default LocationItemsView;
