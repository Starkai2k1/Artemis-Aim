import React from 'react';
import { ArrowLeft, Target, MapPin, Home, Sun, Thermometer, Wind, Compass } from 'lucide-react';
import { useArcheryData } from '../../context/ArcheryContext';
import { DEFAULT_WEATHER } from '../../constants/initialData';

export const SessionSetup = ({ onBack, onStart }) => {
  const { userDefaults, setUserDefaults, globalSettings, setActiveSession } = useArcheryData();
  const safeWeather = userDefaults.weather || DEFAULT_WEATHER;

  const updateWeather = (updates) => {
    setUserDefaults({
      ...userDefaults,
      weather: { ...safeWeather, ...updates }
    });
  };

  const handleStart = () => {
    setActiveSession({
      config: { ...userDefaults, weather: safeWeather },
      data: { passes: [[]], currentPassIndex: 0 },
      date: new Date().toISOString()
    });
    onStart();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center p-4 border-b border-gray-100">
        <button onClick={onBack} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-gray-800">Training einstellen</h1>
      </header>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Regelwerk</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" 
            value={userDefaults.rulesetId}
            onChange={(e) => setUserDefaults({ ...userDefaults, rulesetId: e.target.value })}
          >
            {globalSettings.rulesets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Distanz</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
              value={userDefaults.distance}
              onChange={(e) => setUserDefaults({ ...userDefaults, distance: parseInt(e.target.value) })}
            >
              {globalSettings.distances.map(d => <option key={d} value={d}>{d} m</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Auflage</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
              value={userDefaults.targetSize}
              onChange={(e) => setUserDefaults({ ...userDefaults, targetSize: parseInt(e.target.value) })}
            >
              {globalSettings.targetSizes.map(s => <option key={s} value={s}>{s} cm</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Bogen & Pfeile</label>
          <div className="space-y-3">
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
              value={userDefaults.bowId}
              onChange={(e) => setUserDefaults({ ...userDefaults, bowId: e.target.value })}
            >
              {globalSettings.bows.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
              value={userDefaults.arrowId}
              onChange={(e) => setUserDefaults({ ...userDefaults, arrowId: e.target.value })}
            >
              {globalSettings.arrows.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={18}/> Ort & Wetter</h3>
          <input 
            type="text" 
            placeholder="Ort..." 
            className="w-full p-2 mb-4 bg-white border border-gray-200 rounded-lg text-sm" 
            value={safeWeather.location || ''} 
            onChange={(e) => updateWeather({ location: e.target.value })} 
          />

          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button onClick={() => updateWeather({ isOutdoor: false })} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${!safeWeather.isOutdoor ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}><Home size={16}/> Halle</button>
            <button onClick={() => updateWeather({ isOutdoor: true })} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${safeWeather.isOutdoor ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}><Sun size={16}/> Freiluft</button>
          </div>

          {safeWeather.isOutdoor && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-600">
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Bedingung</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.condition} onChange={(e) => updateWeather({ condition: e.target.value })}>
                    <option value="sonnig">Sonnig</option>
                    <option value="bewoelkt">Bewölkt</option>
                    <option value="regen">Regen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Thermometer size={12}/> Temp (°C)</label>
                  <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.temperature} onChange={(e) => updateWeather({ temperature: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <button onClick={handleStart} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg">
          <Target size={20} /> Training Starten
        </button>
      </div>
    </div>
  );
};
