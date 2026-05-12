import React, { useState } from 'react';
import { Icons } from '../../components/ui/Icons';

function BodegaCard({ name, items, icon: Icon, active, onClick, onNameChange, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  let ComputedIcon = Icon;
  if (!ComputedIcon) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cuartel') || lowerName.includes('central')) ComputedIcon = Icons.Dashboard;
    else if (lowerName.includes('oficina') || lowerName.includes('guardia')) ComputedIcon = Icons.Shield;
    else if (lowerName.includes('carro') || lowerName.includes('ambulancia') || lowerName.includes('rescate')) ComputedIcon = Icons.Truck;
    else if (lowerName.includes('casino')) ComputedIcon = Icons.Finance;
    else ComputedIcon = Icons.Inventory;
  }

  return (
    <div
      onClick={!isEditing ? onClick : undefined}
      className={`relative flex flex-col items-center justify-center p-6 pt-10 pb-8 bg-dark-surface border rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:shadow-brand-cyan/10 ${active ? 'border-brand-cyan ring-1 ring-brand-cyan bg-brand-cyan/5' : 'border-dark-border hover:border-brand-cyan/30'}`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {!isEditing && onNameChange && (
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTempName(name); }} className="text-text-muted hover:text-brand-cyan transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        )}
        {!isEditing && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-text-muted hover:text-brand-red transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        )}
        <div className="flex items-center text-xs font-semibold text-text-muted bg-dark-bg px-2 py-1 rounded-md border border-dark-border shadow-sm">
          <svg className="w-3 h-3 mr-1 text-text-muted opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2-2z"></path></svg>
          {items}
        </div>
      </div>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${active ? 'bg-brand-cyan text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'bg-dark-bg text-text-muted border border-dark-border'}`}>
        <div className="w-6 h-6 flex items-center justify-center">
          <ComputedIcon />
        </div>
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2 w-full mt-1 px-4" onClick={e => e.stopPropagation()}>
          <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-dark-bg2 border border-brand-cyan rounded text-white focus:outline-none text-center rajdhani" />
          <button onClick={(e) => { e.stopPropagation(); onNameChange(tempName); setIsEditing(false); }} className="text-brand-green hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="text-brand-red hover:opacity-80"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      ) : (
        <h3 className={`text-base font-semibold text-center rajdhani px-4 ${active ? 'text-brand-cyan' : 'text-text-main'}`}>{name}</h3>
      )}
    </div>
  );
}

export default BodegaCard;
