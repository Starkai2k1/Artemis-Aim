import React, { useState } from 'react';
import { ArcheryProvider, useArcheryData } from './context/ArcheryContext';
import { Settings, Target, Plus, List, Trash2, BarChart2 } from 'lucide-react';

// Components
import { ActiveSession } from './components/session/ActiveSession';
import { SessionSetup } from './components/session/SessionSetup';
import { SettingsManager } from './components/settings/SettingsManager';

function ArcheryAppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { sessions, setSessions } = useArcheryData();

  const deleteSession = (idx) => {
    const updated = sessions.filter((_, i) => i !== idx);
    setSessions(updated);
  };

  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-green-800">Artemis Aim</h1>
        <button onClick={() => setCurrentView('settings')} className="p-2 bg-white rounded-full shadow-sm text-gray-600">
          <Settings size={24} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          onClick={() => setCurrentView('setup')}
          className="bg-green-600 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-transform"
        >
          <Plus size={32} />
          <span className="font-semibold text-sm">Neues Training</span>
        </button>
        <button 
          onClick={() => setCurrentView('globalStats')}
          className="bg-white text-blue-600 p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 border border-blue-100 hover:bg-blue-50 active:scale-95 transition-transform"
        >
          <BarChart2 size={32} />
          <span className="font-semibold text-sm">Auswertung</span>
        </button>
      </div>

      <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
        <List size={20} /> Letzte Trainings
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">Noch keine Trainings aufgezeichnet.</p>
        ) : (
          sessions.map((session, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{new Date(session.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{session.config.distance}m | Ø {session.average?.toFixed(1) || 0} Pkt.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-black text-gray-800">{session.totalScore}</div>
                <button onClick={() => deleteSession(idx)} className="text-red-400 p-2"><Trash2 size={20} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-black flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md h-full bg-white shadow-2xl relative overflow-hidden flex flex-col">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'setup' && <SessionSetup onBack={() => setCurrentView('dashboard')} onStart={() => setCurrentView('active')} />}
        {currentView === 'active' && <ActiveSession onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'settings' && <SettingsManager onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'globalStats' && <div className="p-4">Global Stats (Modularisierung folgt...) <button onClick={() => setCurrentView('dashboard')}>Zurück</button></div>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ArcheryProvider>
      <ArcheryAppContent />
    </ArcheryProvider>
  );
}
