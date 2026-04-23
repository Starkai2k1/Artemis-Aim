import React, { useState } from 'react';
import { ArrowLeft, Star, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { useArcheryData } from '../../context/ArcheryContext';
import { INITIAL_BOW_FORM, INITIAL_ARROW_FORM } from '../../constants/initialData';

export const SettingsManager = ({ onBack }) => {
  const { globalSettings, setGlobalSettings, userDefaults, setUserDefaults } = useArcheryData();
  const [activeTab, setActiveTab] = useState('rulesets');
  
  // Lokale Form-States
  const [bowForm, setBowForm] = useState(INITIAL_BOW_FORM);
  const [editingBowId, setEditingBowId] = useState(null);

  const saveBow = () => {
    if (!bowForm.name.trim()) return;
    const updatedBows = editingBowId 
      ? globalSettings.bows.map(b => b.id === editingBowId ? { ...bowForm, id: editingBowId } : b)
      : [...globalSettings.bows, { ...bowForm, id: 'b_' + Date.now() }];
    
    setGlobalSettings({ ...globalSettings, bows: updatedBows });
    setBowForm(INITIAL_BOW_FORM);
    setEditingBowId(null);
  };

  const deleteBow = (id) => {
    const updated = globalSettings.bows.filter(b => b.id !== id);
    setGlobalSettings({ ...globalSettings, bows: updated });
    if (userDefaults.bowId === id && updated.length > 0) setUserDefaults({ ...userDefaults, bowId: updated[0].id });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex flex-col p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-bold text-gray-800">Einstellungen</h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('rulesets')} className={`flex-1 py-2 text-sm font-bold rounded-md ${activeTab === 'rulesets' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Regeln</button>
          <button onClick={() => setActiveTab('bows')} className={`flex-1 py-2 text-sm font-bold rounded-md ${activeTab === 'bows' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Bögen</button>
          <button onClick={() => setActiveTab('arrows')} className={`flex-1 py-2 text-sm font-bold rounded-md ${activeTab === 'arrows' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Pfeile</button>
        </div>
      </header>

      <div className="p-4 overflow-y-auto flex-1 pb-20">
        {activeTab === 'bows' && (
          <div className="space-y-6">
            <ul className="space-y-3">
              {globalSettings.bows.map(b => (
                <li key={b.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <strong className="text-sm text-gray-800 flex items-center gap-2">
                      {b.name} {userDefaults.bowId === b.id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Standard</span>}
                    </strong>
                    <span className="text-xs text-gray-500 block">{b.type} - {b.riserBrand} ({b.drawWeight} lbs)</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => setUserDefaults({ ...userDefaults, bowId: b.id })} className={`p-2 ${userDefaults.bowId === b.id ? 'text-yellow-500' : 'text-gray-300'}`}><Star size={18} fill={userDefaults.bowId === b.id ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => { setBowForm(b); setEditingBowId(b.id); }} className="text-blue-400 p-2"><Pencil size={18} /></button>
                    <button onClick={() => deleteBow(b.id)} className="text-red-400 p-2"><Trash2 size={18} /></button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">{editingBowId ? 'Bogen bearbeiten' : 'Neuer Bogen'}</h4>
              <input 
                type="text" 
                placeholder="Name" 
                className="w-full p-2 mb-3 bg-white border border-gray-200 rounded-lg text-sm font-bold" 
                value={bowForm.name} 
                onChange={(e) => setBowForm({ ...bowForm, name: e.target.value })} 
              />
              <div className="grid grid-cols-2 gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="Marke" 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                  value={bowForm.riserBrand} 
                  onChange={(e) => setBowForm({ ...bowForm, riserBrand: e.target.value })} 
                />
                <input 
                  type="number" 
                  placeholder="lbs" 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                  value={bowForm.drawWeight} 
                  onChange={(e) => setBowForm({ ...bowForm, drawWeight: parseInt(e.target.value) || 0 })} 
                />
              </div>
              <button onClick={saveBow} className="w-full bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1">
                <Check size={16} /> Speichern
              </button>
            </div>
          </div>
        )}

        {activeTab !== 'bows' && (
          <p className="text-center text-gray-400 mt-10">Weitere Tabs werden modularisiert...</p>
        )}
      </div>
    </div>
  );
};
