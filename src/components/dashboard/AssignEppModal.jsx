import React, { useState } from 'react';

function AssignEppModal({ onClose, onAssign }) {
  const [selectedVoluntario, setSelectedVoluntario] = useState("");
  const [searchEpp, setSearchEpp] = useState("");
  const [selectedEppIds, setSelectedEppIds] = useState([]);

  const voluntarios = [
    { id: 1, nombre: "Miguel Soto", cargo: "Bombero Activo", inicial: "M" },
    { id: 2, nombre: "Juan Pérez", cargo: "Teniente 1°", inicial: "J" },
    { id: 3, nombre: "Ana Rojas", cargo: "Bombero Activo", inicial: "A" }
  ];

  const eppDisponibles = [
    { id: 101, equipo: "Casco Estructural Gallet F1", codigo: "EPP-CAS-045", tipo: "Protección Cabeza", estado: "Operativo" },
    { id: 102, equipo: "Botas de Rescate Haix", codigo: "EPP-BOT-012", tipo: "Calzado", estado: "Operativo" },
    { id: 103, equipo: "Cota Estructural Lion", codigo: "EPP-COT-089", tipo: "Vestuario", estado: "Nuevo" },
    { id: 104, equipo: "Guantes Estructurales Seiz", codigo: "EPP-GUA-112", tipo: "Protección Manos", estado: "Operativo" }
  ];

  const filteredEpp = eppDisponibles.filter(item => 
    item.equipo.toLowerCase().includes(searchEpp.toLowerCase()) || 
    item.codigo.toLowerCase().includes(searchEpp.toLowerCase())
  );

  const toggleEpp = (id) => {
    setSelectedEppIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            <h3 className="text-lg font-bold text-white rajdhani tracking-wide">Asignar Equipo de Protección Personal</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Voluntario Select */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 rajdhani tracking-wide">Seleccionar Voluntario <span className="text-brand-red">*</span></label>
            <div className="relative">
              <select 
                value={selectedVoluntario}
                onChange={(e) => setSelectedVoluntario(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all"
              >
                <option value="">Seleccionar voluntario...</option>
                {voluntarios.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre} ({v.cargo})</option>
                ))}
              </select>
              <div className="absolute left-3 top-2.5 w-7 h-7 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan font-bold text-xs">
                {selectedVoluntario ? voluntarios.find(v => v.id.toString() === selectedVoluntario)?.inicial : '?'}
              </div>
              <svg className="w-4 h-4 absolute right-4 top-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* EPP List */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-white rajdhani tracking-wide">Seleccionar EPP disponibles <span className="text-brand-red">*</span></label>
              <span className="text-xs text-text-muted">{selectedEppIds.length} seleccionados</span>
            </div>
            
            <div className="relative mb-3">
              <svg className="w-4 h-4 absolute left-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted"
                value={searchEpp}
                onChange={(e) => setSearchEpp(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredEpp.map(item => {
                const isSelected = selectedEppIds.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => toggleEpp(item.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-brand-cyan/10 border-brand-cyan shadow-[0_0_10px_rgba(56,189,248,0.1)]' : 'bg-dark-bg border-dark-border hover:border-brand-cyan/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-cyan border-brand-cyan' : 'border-dark-border bg-dark-bg3'}`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-dark-bg font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${isSelected ? 'text-brand-cyan' : 'text-white'}`}>{item.equipo}</div>
                        <div className="text-xs text-text-muted font-mono">{item.codigo}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-xs text-text-muted">{item.tipo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${item.estado === 'Nuevo' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'}`}>
                        {item.estado}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredEpp.length === 0 && (
                <div className="text-center py-6 text-text-muted text-sm border border-dashed border-dark-border rounded-lg">
                  No se encontraron EPP con ese criterio.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-between items-center shrink-0">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver
          </button>
          <button 
            disabled={!selectedVoluntario || selectedEppIds.length === 0}
            onClick={() => {
              if (selectedVoluntario && selectedEppIds.length > 0) {
                const selectedItems = selectedEppIds.map(id => eppDisponibles.find(e => e.id === id));
                const voluntario = voluntarios.find(v => v.id.toString() === selectedVoluntario);
                
                const newAssignments = selectedItems.map(item => ({
                  id: Date.now() + Math.random(),
                  equipo: item.equipo,
                  codigo: item.codigo,
                  asignadoA: voluntario.nombre,
                  inicial: voluntario.inicial,
                  fecha: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
                  estado: item.estado
                }));

                onAssign(newAssignments);
                onClose();
              }
            }}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(59,130,246,0.4)] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Asignar ({selectedEppIds.length}) Equipos
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignEppModal;
