import React, { useState, useEffect } from 'react';
import { Settings, Target, Plus, ArrowLeft, Check, List, Crosshair, Trash2, Pencil, BarChart2, PauseCircle, Play, Star, TrendingUp, Lightbulb, Sun, Cloud, CloudRain, Snowflake, Wind, Thermometer, Compass, Home, MapPin, Filter } from 'lucide-react';

// --- INITIALE DATEN & KONFIGURATION ---
const initialGlobalSettings = {
  distances: [18, 30, 50, 70],
  targetSizes: [40, 60, 80, 122],
  rulesets: [
    { id: 'r1', name: 'Turnier Halle (3 Pfeile)', arrowsPerPass: 3, totalPasses: 10 },
    { id: 'r2', name: 'Turnier WA 720 (6 Pfeile)', arrowsPerPass: 6, totalPasses: 12 },
    { id: 'r3', name: 'Freies Training (Endlos)', arrowsPerPass: 3, totalPasses: 999 }
  ],
  bows: [
    { id: 'b1', name: 'Turnier-Recurve', type: 'Recurve', handedness: 'RH', riserBrand: 'WNS Motive', riserSystem: 'ILF (Metall)', limbBrand: 'WNS', drawWeight: 30 },
    { id: 'b2', name: 'Blankbogen Setup', type: 'Blankbogen', handedness: 'RH', riserBrand: 'Spigarelli', riserSystem: 'ILF (Metall)', limbBrand: 'Uukha', drawWeight: 35 }
  ],
  arrows: [
    { id: 'a1', name: 'Outdoor Carbon', brand: 'Carbon Express', spine: 800, length: 29.5, nock: 'Pin-Nock', pointWeight: 90, pointType: 'Klebespitze' },
    { id: 'a2', name: 'Halle Alu', brand: 'Easton X7', spine: 2014, length: 30, nock: 'In-Nock', pointWeight: 100, pointType: 'Schraubspitze' }
  ]
};

const defaultWeather = {
  isOutdoor: true,
  condition: 'sonnig',
  temperature: 20,
  windSpeed: 0,
  windDirection: 'N',
  location: ''
};

const defaultSettings = {
  rulesetId: 'r1',
  distance: 18,
  targetSize: 40,
  bowId: 'b1',
  arrowId: 'a1',
  weather: defaultWeather
};

const initialBowForm = { name: '', type: 'Recurve', handedness: 'RH', riserBrand: '', riserSystem: 'ILF (Metall)', limbBrand: '', drawWeight: 30 };
const initialArrowForm = { name: '', brand: '', spine: 500, length: 29, nock: '', pointWeight: 100, pointType: '' };

// --- HILFS-KOMPONENTEN ---
const renderTargetFace = () => (
  <>
    <circle cx="0" cy="0" r="1" fill="#FFFFFF" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.9" fill="#FFFFFF" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.8" fill="#000000" stroke="#FFF" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.7" fill="#000000" stroke="#FFF" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.6" fill="#00B4E4" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.5" fill="#00B4E4" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.4" fill="#F42A41" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.3" fill="#F42A41" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.2" fill="#FFE552" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.1" fill="#FFE552" stroke="#000" strokeWidth="0.01"/>
    <circle cx="0" cy="0" r="0.05" fill="#FFE552" stroke="#000" strokeWidth="0.01"/>
    <line x1="-0.02" y1="0" x2="0.02" y2="0" stroke="#000" strokeWidth="0.005" />
    <line x1="0" y1="-0.02" x2="0" y2="0.02" stroke="#000" strokeWidth="0.005" />
  </>
);

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default function ArcheryApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [globalSettings, setGlobalSettings] = useLocalStorage('archery_global_settings_v4', initialGlobalSettings);
  const [userDefaults, setUserDefaults] = useLocalStorage('archery_user_defaults_v4', defaultSettings);
  const [sessions, setSessions] = useLocalStorage('archery_saved_sessions_v4', []);
  
  const [currentSessionConfig, setCurrentSessionConfig] = useState(null);
  const [activeSessionData, setActiveSessionData] = useState({ passes: [], currentPassIndex: 0 });
  const [dragState, setDragState] = useState(null);

  const [settingsTab, setSettingsTab] = useState('rulesets'); 
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(null); 
  const [endModalVisible, setEndModalVisible] = useState(false); 

  const [rulesetForm, setRulesetForm] = useState({ name: '', arrowsPerPass: 3, totalPasses: 10 });
  const [editingRulesetId, setEditingRulesetId] = useState(null);

  const [bowForm, setBowForm] = useState(initialBowForm);
  const [editingBowId, setEditingBowId] = useState(null);

  const [arrowForm, setArrowForm] = useState(initialArrowForm);
  const [editingArrowId, setEditingArrowId] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);
  const [weatherEditModal, setWeatherEditModal] = useState(null);

  const [newDistance, setNewDistance] = useState('');
  const [newTargetSize, setNewTargetSize] = useState('');

  // NEU: State für die Filter in der Gesamt-Auswertung
  const [statsFilter, setStatsFilter] = useState({
    bowId: 'all',
    arrowId: 'all',
    distance: 'all',
    targetSize: 'all',
    rulesetId: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const safeWeather = userDefaults.weather || defaultWeather;

  const calculateScore = (x, y) => {
    const distance = Math.sqrt(x * x + y * y);
    if (distance > 1) return 'M';
    let score = Math.ceil(10 - (distance * 10));
    if (score === 0) score = 1;
    if (score < 0) return 'M';
    return score;
  };

  const executeDelete = () => {
    if (!deleteModal) return;
    const { type, id } = deleteModal;
    if (type === 'session') setSessions(sessions.filter((_, idx) => idx !== id));
    else if (type === 'ruleset') {
      const updated = globalSettings.rulesets.filter(r => r.id !== id);
      setGlobalSettings({ ...globalSettings, rulesets: updated });
      if (userDefaults.rulesetId === id && updated.length > 0) setUserDefaults({ ...userDefaults, rulesetId: updated[0].id });
    } else if (type === 'bow') {
      const updated = globalSettings.bows.filter(b => b.id !== id);
      setGlobalSettings({ ...globalSettings, bows: updated });
      if (userDefaults.bowId === id && updated.length > 0) setUserDefaults({ ...userDefaults, bowId: updated[0].id });
    } else if (type === 'arrow') {
      const updated = globalSettings.arrows.filter(a => a.id !== id);
      setGlobalSettings({ ...globalSettings, arrows: updated });
      if (userDefaults.arrowId === id && updated.length > 0) setUserDefaults({ ...userDefaults, arrowId: updated[0].id });
    } else if (type === 'arrow_pass') {
      const newPasses = [...activeSessionData.passes];
      const updatedPass = newPasses[activeSessionData.currentPassIndex].filter((_, idx) => idx !== id);
      newPasses[activeSessionData.currentPassIndex] = updatedPass;
      setActiveSessionData({ ...activeSessionData, passes: newPasses });
    } else if (type === 'distance') {
      const updated = globalSettings.distances.filter(d => d !== id);
      setGlobalSettings({ ...globalSettings, distances: updated });
      if (userDefaults.distance === id && updated.length > 0) setUserDefaults({ ...userDefaults, distance: updated[0] });
    } else if (type === 'targetSize') {
      const updated = globalSettings.targetSizes.filter(s => s !== id);
      setGlobalSettings({ ...globalSettings, targetSizes: updated });
      if (userDefaults.targetSize === id && updated.length > 0) setUserDefaults({ ...userDefaults, targetSize: updated[0] });
    }
    setDeleteModal(null);
  };

  const deleteSession = (indexToDelete) => setDeleteModal({ type: 'session', id: indexToDelete, text: 'Möchtest du dieses Training wirklich löschen?' });

  const resumeSession = (index, e) => {
    e.stopPropagation(); 
    const sessionToResume = sessions[index];
    setCurrentSessionConfig(sessionToResume.config);
    setActiveSessionData(sessionToResume.data);
    setSessions(sessions.filter((_, idx) => idx !== index));
    setCurrentView('active');
  };

  const updateWeatherSetting = (updates) => {
    setUserDefaults({
      ...userDefaults,
      weather: { ...safeWeather, ...updates }
    });
  };

  const saveWeatherEdit = () => {
    if (!weatherEditModal) return;
    const newSessions = [...sessions];
    newSessions[weatherEditModal.sessionIndex].config.weather = weatherEditModal.weatherData;
    setSessions(newSessions);
    setWeatherEditModal(null);
  };

  const saveRuleset = () => {
    if (!rulesetForm.name.trim()) return;
    let updatedRulesets = editingRulesetId ? globalSettings.rulesets.map(r => r.id === editingRulesetId ? { ...rulesetForm, id: editingRulesetId } : r) : [...globalSettings.rulesets, { ...rulesetForm, id: 'r_' + Date.now() }];
    setGlobalSettings({ ...globalSettings, rulesets: updatedRulesets });
    setRulesetForm({ name: '', arrowsPerPass: 3, totalPasses: 10 });
    setEditingRulesetId(null);
  };
  const deleteRuleset = (id) => setDeleteModal({ type: 'ruleset', id: id, text: 'Regelwerk wirklich löschen?' });

  const addDistance = () => {
    const val = parseInt(newDistance);
    if (val && !globalSettings.distances.includes(val)) setGlobalSettings({ ...globalSettings, distances: [...globalSettings.distances, val].sort((a, b) => a - b) });
    setNewDistance('');
  };
  const addTargetSize = () => {
    const val = parseInt(newTargetSize);
    if (val && !globalSettings.targetSizes.includes(val)) setGlobalSettings({ ...globalSettings, targetSizes: [...globalSettings.targetSizes, val].sort((a, b) => a - b) });
    setNewTargetSize('');
  };

  const saveBow = () => {
    if (!bowForm.name.trim()) return;
    let updatedBows = editingBowId ? globalSettings.bows.map(b => b.id === editingBowId ? { ...bowForm, id: editingBowId } : b) : [...globalSettings.bows, { ...bowForm, id: 'b_' + Date.now() }];
    setGlobalSettings({ ...globalSettings, bows: updatedBows });
    setBowForm(initialBowForm);
    setEditingBowId(null);
  };
  const deleteBow = (id) => setDeleteModal({ type: 'bow', id: id, text: 'Bogen wirklich löschen?' });

  const saveArrow = () => {
    if (!arrowForm.name.trim()) return;
    let updatedArrows = editingArrowId ? globalSettings.arrows.map(a => a.id === editingArrowId ? { ...arrowForm, id: editingArrowId } : a) : [...globalSettings.arrows, { ...arrowForm, id: 'a_' + Date.now() }];
    setGlobalSettings({ ...globalSettings, arrows: updatedArrows });
    setArrowForm(initialArrowForm);
    setEditingArrowId(null);
  };
  const deleteArrow = (id) => setDeleteModal({ type: 'arrow', id: id, text: 'Pfeil-Setup wirklich löschen?' });


  // --- ANSICHTEN ---
  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-green-800">Bullseye Tracker</h1>
        <button onClick={() => setCurrentView('settings')} className="p-2 bg-white rounded-full shadow-sm text-gray-600">
          <Settings size={24} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          onClick={() => {
            setCurrentSessionConfig({...userDefaults, weather: safeWeather});
            setActiveSessionData({ passes: [[]], currentPassIndex: 0 });
            setCurrentView('active');
          }}
          className="bg-green-600 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-transform"
        >
          <Target size={32} />
          <span className="font-semibold text-sm">Schnellstart</span>
        </button>
        <button 
          onClick={() => setCurrentView('setup')}
          className="bg-white text-green-600 p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 border border-green-100 hover:bg-green-50 active:scale-95 transition-transform"
        >
          <Plus size={32} />
          <span className="font-semibold text-sm">Neues Training</span>
        </button>
      </div>

      <button 
        onClick={() => setCurrentView('globalStats')}
        className="w-full bg-blue-50 text-blue-700 p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center gap-2 font-bold mb-8 hover:bg-blue-100 active:scale-95 transition-all"
      >
        <BarChart2 size={24} /> Gesamt-Auswertung
      </button>

      <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
        <List size={20} /> Letzte Trainings
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">Noch keine Trainings aufgezeichnet.</p>
        ) : (
          sessions.map((session, idx) => {
            const isPaused = session.status === 'paused';
            return (
              <div 
                key={idx} 
                onClick={() => { if (!isPaused) { setSelectedSessionIndex(idx); setCurrentView('stats'); } }}
                className={`bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center transition-colors ${
                  isPaused ? 'border-orange-300 bg-orange-50' : 'border-gray-100 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{new Date(session.date).toLocaleDateString()}</p>
                    {isPaused && <span className="text-[10px] uppercase font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1"><PauseCircle size={10}/> Pausiert</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.config.distance}m | {isPaused ? `Passe ${session.data.currentPassIndex + 1}` : `Ø ${session.average.toFixed(1)} Pkt.`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xl font-black text-gray-800">
                    {session.totalScore}
                  </div>
                  {isPaused && (
                    <button onClick={(e) => resumeSession(idx, e)} className="bg-orange-500 text-white p-2 rounded-full shadow-sm"><Play size={16} className="ml-0.5" /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(idx); }} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => setCurrentView('dashboard')} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold text-gray-800">Training einstellen</h1>
      </header>
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Regelwerk</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e) => setUserDefaults({...userDefaults, rulesetId: e.target.value})} value={userDefaults.rulesetId}>
            {globalSettings.rulesets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Distanz</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e) => setUserDefaults({...userDefaults, distance: parseInt(e.target.value)})} value={userDefaults.distance}>
              {globalSettings.distances.map(d => <option key={d} value={d}>{d} m</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Auflage</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e) => setUserDefaults({...userDefaults, targetSize: parseInt(e.target.value)})} value={userDefaults.targetSize}>
              {globalSettings.targetSizes.map(s => <option key={s} value={s}>{s} cm</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Bogen</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e) => setUserDefaults({...userDefaults, bowId: e.target.value})} value={userDefaults.bowId}>
            {globalSettings.bows.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Pfeile</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e) => setUserDefaults({...userDefaults, arrowId: e.target.value})} value={userDefaults.arrowId}>
            {globalSettings.arrows.map(a => <option key={a.id} value={a.id}>{a.name} ({a.spine})</option>)}
          </select>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={18}/> Ort & Wetter</h3>
          
          <input 
            type="text" 
            placeholder="Ort (z.B. Vereinsplatz, Bogenhalle...)" 
            className="w-full p-2 mb-4 bg-white border border-gray-200 rounded-lg text-sm" 
            value={safeWeather.location || ''} 
            onChange={(e) => updateWeatherSetting({location: e.target.value})} 
          />

          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button onClick={() => updateWeatherSetting({isOutdoor: false})} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${!safeWeather.isOutdoor ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}><Home size={16}/> Halle</button>
            <button onClick={() => updateWeatherSetting({isOutdoor: true})} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${safeWeather.isOutdoor ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}><Sun size={16}/> Freiluft</button>
          </div>

          {safeWeather.isOutdoor && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Bedingung</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.condition} onChange={(e) => updateWeatherSetting({condition: e.target.value})}>
                    <option value="sonnig">Sonnig</option>
                    <option value="bewoelkt">Bewölkt</option>
                    <option value="regen">Regen</option>
                    <option value="schnee">Schnee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Thermometer size={12}/> Temp (°C)</label>
                  <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.temperature} onChange={(e) => updateWeatherSetting({temperature: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Wind size={12}/> Wind (km/h)</label>
                  <input type="number" min="0" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.windSpeed} onChange={(e) => updateWeatherSetting({windSpeed: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Compass size={12}/> Richtung</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={safeWeather.windDirection} onChange={(e) => updateWeatherSetting({windDirection: e.target.value})}>
                    <option value="N">N (Nord)</option>
                    <option value="NO">NO</option>
                    <option value="O">O (Ost)</option>
                    <option value="SO">SO</option>
                    <option value="S">S (Süd)</option>
                    <option value="SW">SW</option>
                    <option value="W">W (West)</option>
                    <option value="NW">NW</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
      <div className="p-4 border-t">
        <button 
          onClick={() => {
            setCurrentSessionConfig({...userDefaults, weather: safeWeather});
            setActiveSessionData({ passes: [[]], currentPassIndex: 0 });
            setCurrentView('active');
          }}
          className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2"
        >
          <Target size={20} /> Training Starten
        </button>
      </div>
    </div>
  );

  const renderActiveSession = () => {
    const ruleset = globalSettings.rulesets.find(r => r.id === currentSessionConfig.rulesetId);
    const currentPass = activeSessionData.passes[activeSessionData.currentPassIndex] || [];
    const isLastPass = activeSessionData.currentPassIndex >= ruleset.totalPasses - 1;
    const passSum = currentPass.reduce((sum, arrow) => sum + (arrow.score === 'M' ? 0 : arrow.score), 0);
    const totalSum = activeSessionData.passes.flat().reduce((sum, arrow) => sum + (arrow.score === 'M' ? 0 : arrow.score), 0);

    const updateDragPos = (e, rect) => {
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      let x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      let y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setDragState({ x: clamp(x, -1.1, 1.1), y: clamp(y, -1.1, 1.1), clientX: e.clientX, clientY: e.clientY, rect });
    };

    const handlePointerDown = (e) => {
      if (currentPass.length >= ruleset.arrowsPerPass) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateDragPos(e, e.currentTarget.getBoundingClientRect());
    };
    const handlePointerMove = (e) => { if (dragState) updateDragPos(e, dragState.rect); };
    const handlePointerUp = (e) => {
      if (!dragState) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const score = calculateScore(dragState.x, dragState.y);
      const newPasses = [...activeSessionData.passes];
      newPasses[activeSessionData.currentPassIndex] = [...currentPass, { x: dragState.x, y: dragState.y, score }];
      setActiveSessionData({ ...activeSessionData, passes: newPasses });
      setDragState(null);
    };
    const handlePointerCancel = () => setDragState(null);

    const nextPass = () => {
      if (!isLastPass) setActiveSessionData({...activeSessionData, passes: [...activeSessionData.passes, []], currentPassIndex: activeSessionData.currentPassIndex + 1});
    };

    const confirmEndSession = (status) => {
      const allArrows = activeSessionData.passes.flat();
      const newSession = {
        date: new Date().toISOString(),
        config: currentSessionConfig,
        data: activeSessionData,
        totalScore: totalSum,
        average: allArrows.length > 0 ? totalSum / allArrows.length : 0,
        status: status 
      };
      setSessions([newSession, ...sessions]);
      setEndModalVisible(false);
      if (status === 'completed') {
        setSelectedSessionIndex(0); 
        setCurrentView('stats');
      } else {
        setCurrentView('dashboard');
      }
    };

    return (
      <div className="flex flex-col h-full bg-gray-900 text-white relative">
        <header className="flex justify-between items-center p-4 bg-gray-800">
          <div>
            <p className="text-xs text-gray-400">Passe {activeSessionData.currentPassIndex + 1} / {ruleset.totalPasses}</p>
            <h2 className="text-xl font-bold">Gesamt: {totalSum}</h2>
          </div>
          <button onClick={() => setEndModalVisible(true)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Beenden</button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="mb-4 text-gray-300">Berühre und ziehe die Scheibe, um genau zu zielen</p>
          <div 
            className="relative w-full max-w-[300px] aspect-square rounded-full overflow-hidden shadow-2xl cursor-crosshair bg-white touch-none select-none"
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}
          >
            <svg viewBox="-1 -1 2 2" className="w-full h-full pointer-events-none">{renderTargetFace()}</svg>
            {currentPass.map((arrow, i) => (
              <div key={i} className="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm" style={{ left: `${(arrow.x + 1) * 50}%`, top: `${(arrow.y + 1) * 50}%` }} />
            ))}
            {dragState && (
              <div className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm animate-pulse z-10" style={{ left: `${(dragState.x + 1) * 50}%`, top: `${(dragState.y + 1) * 50}%` }} />
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 pb-8 rounded-t-3xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Aktuelle Passe</h3>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">Passe Summe: {passSum}</span>
          </div>
          <div className="flex gap-2 justify-center mb-6 h-12">
            {[...Array(ruleset.arrowsPerPass)].map((_, i) => (
              <div key={i} onClick={() => currentPass[i] && setDeleteModal({ type: 'arrow_pass', id: i, text: 'Pfeil löschen?' })} className={`flex-1 max-w-[3rem] rounded-lg flex items-center justify-center font-bold text-xl border border-gray-600 transition-colors ${currentPass[i] ? 'bg-gray-700 cursor-pointer' : 'bg-gray-800'}`}>
                {currentPass[i] ? currentPass[i].score : '-'}
              </div>
            ))}
          </div>
          <button onClick={isLastPass ? () => setEndModalVisible(true) : nextPass} disabled={currentPass.length < ruleset.arrowsPerPass} className={`w-full p-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${currentPass.length < ruleset.arrowsPerPass ? 'bg-gray-700 text-gray-500' : isLastPass ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
            {isLastPass ? 'Training beenden' : 'Nächste Passe'} <Check size={20} />
          </button>
        </div>

        {dragState && (
          <div className="fixed z-50 w-32 h-32 bg-white rounded-full border-4 border-gray-800 shadow-2xl overflow-hidden pointer-events-none" style={{ left: dragState.clientX, top: dragState.clientY, transform: 'translate(-50%, -130%)' }}>
            <div className="absolute" style={{ width: dragState.rect.width * 2.5, height: dragState.rect.height * 2.5, left: 64 - (((dragState.x + 1) / 2) * (dragState.rect.width * 2.5)), top: 64 - (((dragState.y + 1) / 2) * (dragState.rect.height * 2.5)) }}>
              <svg viewBox="-1 -1 2 2" className="w-full h-full">{renderTargetFace()}</svg>
              {currentPass.map((arrow, i) => (
                <div key={`mag-${i}`} className="absolute w-5 h-5 bg-green-500 border-[3px] border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm" style={{ left: `${(arrow.x + 1) * 50}%`, top: `${(arrow.y + 1) * 50}%` }} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-80">
               <div className="w-10 h-[2px] bg-gray-900 absolute rounded-full"></div>
               <div className="h-10 w-[2px] bg-gray-900 absolute rounded-full"></div>
               <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white absolute shadow-sm"></div>
            </div>
          </div>
        )}

        {endModalVisible && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl w-full max-w-sm border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">Training beenden</h3>
              <p className="text-gray-400 mb-6 text-sm">Möchtest du das Training komplett speichern, oder nur unterbrechen?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => confirmEndSession('completed')} className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><Check size={18}/> Komplett beenden</button>
                <button onClick={() => confirmEndSession('paused')} className="w-full p-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><PauseCircle size={18}/> Nur unterbrechen</button>
                <button onClick={() => setEndModalVisible(false)} className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-lg transition-colors mt-2">Zurück zum Training</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    const session = sessions[selectedSessionIndex];
    if (!session) return null;
    
    const allArrows = session.data.passes.flat();
    const totalScore = session.totalScore;
    const currentAvgFloat = allArrows.length > 0 ? (totalScore / allArrows.length) : 0;
    const avgScorePerArrow = currentAvgFloat.toFixed(2);

    let scoreCounts = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 'M': 0 };
    let sumX = 0, sumY = 0;
    allArrows.forEach(a => { scoreCounts[a.score]++; sumX += a.x; sumY += a.y; });
    const maxCount = Math.max(...Object.values(scoreCounts));

    const centroidX = allArrows.length > 0 ? sumX / allArrows.length : 0;
    const centroidY = allArrows.length > 0 ? sumY / allArrows.length : 0;

    const otherCompleted = sessions.filter((s, idx) => s.status !== 'paused' && idx !== selectedSessionIndex);

    let globalArrows = 0, globalScore = 0;
    otherCompleted.forEach(s => {
      const arrs = s.data.passes.flat();
      globalArrows += arrs.length;
      globalScore += s.totalScore;
    });
    const globalAvgFloat = globalArrows > 0 ? (globalScore / globalArrows) : null;
    const diffGlobal = globalAvgFloat !== null ? (currentAvgFloat - globalAvgFloat) : null;

    const rulesetSessions = otherCompleted.filter(s => s.config.rulesetId === session.config.rulesetId);
    let rulesetArrows = 0, rulesetScore = 0;
    rulesetSessions.forEach(s => {
      const arrs = s.data.passes.flat();
      rulesetArrows += arrs.length;
      rulesetScore += s.totalScore;
    });
    const rulesetAvgFloat = rulesetArrows > 0 ? (rulesetScore / rulesetArrows) : null;
    const diffRuleset = rulesetAvgFloat !== null ? (currentAvgFloat - rulesetAvgFloat) : null;

    const renderDiffBadge = (diff, label, baseAvg) => {
      if (diff === null || baseAvg === null || baseAvg === 0) {
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm text-gray-400 bg-gray-100 border border-gray-200" title={`Vergleich: ${label} (Zu wenig Daten)`}>
            - % <span className="font-normal opacity-75 ml-0.5">{label}</span>
          </span>
        );
      }
      
      const isPositive = diff > 0;
      const isNegative = diff < 0;
      const colorClass = isPositive ? 'text-green-700 bg-green-100' : isNegative ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100';
      const sign = isPositive ? '+' : '';
      const arrow = isPositive ? '▲' : isNegative ? '▼' : '≈';
      
      const percentage = (diff / baseAvg) * 100;
      
      return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm ${colorClass}`} title={`Vergleich: ${label} (${sign}${diff.toFixed(2)} Pkt)`}>
          {arrow} {sign}{percentage.toFixed(1)}% <span className="font-normal opacity-75 ml-0.5">{label}</span>
        </span>
      );
    };

    const rulesetInfo = globalSettings.rulesets.find(r => r.id === session.config.rulesetId)?.name || 'Unbekanntes Regelwerk';
    const bowInfo = globalSettings.bows.find(b => b.id === session.config.bowId)?.name || 'Unbekannter Bogen';
    const sessionBow = globalSettings.bows.find(b => b.id === session.config.bowId);
    const isLH = sessionBow?.handedness === 'LH';
    
    const ruleset = globalSettings.rulesets.find(r => r.id === session.config.rulesetId);
    const arrowsPerPass = ruleset ? ruleset.arrowsPerPass : 3;

    const sessWeather = session.config.weather || defaultWeather;

    const getWeatherIcon = (cond) => {
      if(cond === 'sonnig') return <Sun size={16} className="text-yellow-500"/>;
      if(cond === 'bewoelkt') return <Cloud size={16} className="text-gray-400"/>;
      if(cond === 'regen') return <CloudRain size={16} className="text-blue-500"/>;
      if(cond === 'schnee') return <Snowflake size={16} className="text-blue-300"/>;
      return <Sun size={16}/>;
    };

    const generateCoachTips = () => {
      if (allArrows.length < 6) return ["Schieße noch ein paar Pfeile (mindestens 6), damit ich deine Gruppierung besser analysieren kann."];
      let tips = [];
      const threshold = 0.15; 
      
      if (centroidX < -threshold) {
        tips.push(isLH ? "Treffer links (LH): Pfeil (Spine) evtl. zu weich oder Plunger zu schwach. Achte auf Rückenspannung." : "Treffer links (RH): Pfeil (Spine) evtl. zu steif oder Plunger zu hart. Achte darauf, die Sehne nicht zu verreißen.");
      } else if (centroidX > threshold) {
        tips.push(isLH ? "Treffer rechts (LH): Pfeil (Spine) evtl. zu steif oder Plunger zu hart. Achte darauf, die Sehne nicht zu verreißen." : "Treffer rechts (RH): Pfeil (Spine) evtl. zu weich oder Plunger zu schwach. Achte auf Rückenspannung.");
      }

      if (centroidY < -threshold) {
        tips.push("Treffer hoch: Überprüfe deinen Ankerpunkt. Bogenarm beim Schuss nicht hochdrücken. Nockpunkt evtl. zu tief.");
      } else if (centroidY > threshold) {
        tips.push("Treffer tief: Bogenarm nach dem Schuss stehen lassen. Ermüdest du leicht? Nockpunkt evtl. zu hoch.");
      }

      if (tips.length === 0 && currentAvgFloat >= 8.5) {
        tips.push("Hervorragende Zentrierung! Deine Gruppierung liegt schön in der Mitte. Behalte diesen Rhythmus bei.");
      } else if (tips.length === 0) {
         tips.push("Deine Treffer sind relativ mittig, aber noch verstreut. Arbeite an einem reproduzierbaren Ablauf.");
      }
      return tips;
    };
    
    const coachTips = generateCoachTips();

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <button onClick={() => setCurrentView('dashboard')} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Detail-Auswertung</h1>
            <p className="text-xs text-gray-500">{new Date(session.date).toLocaleString()}</p>
          </div>
        </header>

        <div className="p-4 flex-1 overflow-y-auto pb-20 space-y-6">
          
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="bg-gray-100 px-2 py-1 rounded-md"><strong>Regel:</strong> {rulesetInfo}</span>
            <span className="bg-gray-100 px-2 py-1 rounded-md"><strong>Distanz:</strong> {session.config.distance}m</span>
            <span className="bg-gray-100 px-2 py-1 rounded-md"><strong>Auflage:</strong> {session.config.targetSize}cm</span>
            <span className="bg-gray-100 px-2 py-1 rounded-md"><strong>Bogen:</strong> {bowInfo}</span>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              {sessWeather.location && (
                <span className="flex items-center gap-1 font-bold text-gray-800 pr-2 border-r border-gray-200">
                  <MapPin size={14} className="text-red-500"/> {sessWeather.location}
                </span>
              )}
              {sessWeather.isOutdoor ? (
                <>
                  <span className="flex items-center gap-1 font-bold">{getWeatherIcon(sessWeather.condition)} <span className="capitalize">{sessWeather.condition}</span></span>
                  <span className="flex items-center gap-1"><Thermometer size={14} className="text-red-400"/> {sessWeather.temperature}°C</span>
                  <span className="flex items-center gap-1"><Wind size={14} className="text-teal-500"/> {sessWeather.windSpeed} km/h ({sessWeather.windDirection})</span>
                </>
              ) : (
                <div className="flex items-center gap-2 font-bold text-gray-700">
                  <Home size={16} className="text-blue-600" /> Halle
                </div>
              )}
            </div>
            <button onClick={() => setWeatherEditModal({ sessionIndex: selectedSessionIndex, weatherData: { ...sessWeather } })} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors ml-2 shrink-0">
              <Pencil size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Gesamtpunkte</p>
                <p className="text-3xl font-black text-green-700">{totalScore}</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Ø Punkte / Pfeil</p>
                <p className="text-3xl font-black text-blue-700">{avgScorePerArrow}</p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                   {renderDiffBadge(diffGlobal, 'Gesamt', globalAvgFloat)}
                   {renderDiffBadge(diffRuleset, 'Regel', rulesetAvgFloat)}
                </div>
             </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Lightbulb size={64} /></div>
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 relative z-10"><Lightbulb size={20} className="text-blue-600"/> Digitaler Coach</h3>
            <ul className="space-y-2 relative z-10">
              {coachTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-200/50 leading-snug">{tip}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Crosshair size={20}/> Treffer-Heatmap</h3>
            <div className="flex justify-center">
               <div className="relative w-full max-w-[280px] aspect-square rounded-full overflow-hidden border border-gray-200 bg-white shadow-inner">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full">
                    <defs>
                      <filter id="heatmapFilterStats" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.025" result="blur1" />
                        <feColorMatrix in="blur1" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -5" result="blob" />
                        <feGaussianBlur in="blob" stdDeviation="0.008" result="blur2" />
                        <feColorMatrix in="blur2" type="matrix" values="0.6 0 0 0 0  0 0.1 0 0 0  0 0.1 0 0 0  0 0 0 40 -4" result="blobOuter" />
                        <feComposite in="blobOuter" in2="blob" operator="out" result="outline" />
                        <feMerge><feMergeNode in="blur1" /><feMergeNode in="outline" /></feMerge>
                      </filter>
                    </defs>
                    {renderTargetFace()}
                    <g filter="url(#heatmapFilterStats)">
                      {allArrows.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.05" fill="#ef4444" opacity="0.6" />)}
                    </g>
                  </svg>
               </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Punkte-Verteilung</h3>
            <div className="space-y-2">
              {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(score => {
                const count = scoreCounts[score];
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                let barColor = 'bg-gray-300';
                if (score === '10' || score === '9') barColor = 'bg-yellow-400';
                else if (score === '8' || score === '7') barColor = 'bg-red-500';
                else if (score === '6' || score === '5') barColor = 'bg-blue-400';
                else if (score === '4' || score === '3') barColor = 'bg-gray-800';
                else if (score === '2' || score === '1') barColor = 'bg-gray-200 border border-gray-300';

                return (
                  <div key={score} className="flex items-center gap-2 text-sm">
                    <div className="w-6 font-bold text-gray-600 text-right">{score}</div>
                    <div className="flex-1 bg-gray-50 rounded-r-md h-6 flex items-center relative">
                      <div className={`h-full rounded-r-md transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%`, minWidth: count > 0 ? '4px' : '0' }} />
                    </div>
                    <div className="w-10 text-right text-xs font-bold text-gray-500">{count}x</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Scorecard (Zettel)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center border-collapse min-w-[250px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="p-2 border border-gray-200 font-bold">P.</th>
                    {[...Array(arrowsPerPass)].map((_, i) => <th key={i} className="p-2 border border-gray-200 font-bold">{i + 1}</th>)}
                    <th className="p-2 border border-gray-200 font-bold">Summe</th>
                    <th className="p-2 border border-gray-200 font-bold">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let runningTotal = 0;
                    return session.data.passes.map((pass, pIdx) => {
                      if (!pass || pass.length === 0) return null; 
                      const passSum = pass.reduce((sum, a) => sum + (a.score === 'M' ? 0 : a.score), 0);
                      runningTotal += passSum;
                      
                      // NEU: Pfeile für die offizielle Zählweise absteigend sortieren ('M' zählt als -1 und landet am Ende)
                      const sortedPass = [...pass].sort((a, b) => {
                        const valA = a.score === 'M' ? -1 : a.score;
                        const valB = b.score === 'M' ? -1 : b.score;
                        return valB - valA;
                      });

                      return (
                        <tr key={pIdx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="p-2 border border-gray-200 font-bold text-gray-700 bg-gray-50">{pIdx + 1}</td>
                          {[...Array(arrowsPerPass)].map((_, aIdx) => {
                            const arrow = sortedPass[aIdx];
                            let displayScore = '-';
                            let textColor = 'text-gray-800';
                            if (arrow) {
                              displayScore = arrow.score;
                              if (displayScore === 10 || displayScore === 9) textColor = 'text-yellow-600 font-black';
                              else if (displayScore === 'M') textColor = 'text-red-500 font-black';
                            }
                            return <td key={aIdx} className={`p-2 border border-gray-200 ${textColor}`}>{displayScore}</td>;
                          })}
                          <td className="p-2 border border-gray-200 font-bold text-gray-800">{passSum}</td>
                          <td className="p-2 border border-gray-200 font-black text-blue-700 bg-blue-50/50">{runningTotal}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderGlobalStats = () => {
    // 1. Daten filtern anhand der ausgewählten Dropdowns
    const completedSessions = sessions.filter(s => {
      if (s.status === 'paused') return false;
      if (statsFilter.bowId !== 'all' && s.config.bowId !== statsFilter.bowId) return false;
      if (statsFilter.arrowId !== 'all' && s.config.arrowId !== statsFilter.arrowId) return false;
      if (statsFilter.distance !== 'all' && s.config.distance !== parseInt(statsFilter.distance)) return false;
      if (statsFilter.targetSize !== 'all' && s.config.targetSize !== parseInt(statsFilter.targetSize)) return false;
      if (statsFilter.rulesetId !== 'all' && s.config.rulesetId !== statsFilter.rulesetId) return false;
      return true;
    });

    let totalArrows = 0; let totalScore = 0; let goldHits = 0; 
    let scoreCounts = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 'M': 0 };
    let allPoints = [];

    completedSessions.forEach(session => {
      const arrows = session.data.passes.flat();
      totalArrows += arrows.length;
      totalScore += session.totalScore;
      arrows.forEach(a => {
        scoreCounts[a.score]++;
        if (a.score === 10 || a.score === 9) goldHits++;
        allPoints.push({ x: a.x, y: a.y });
      });
    });

    const totalSessions = completedSessions.length;
    const avgScorePerArrow = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '0.00';
    const avgScorePerSession = totalSessions > 0 ? (totalScore / totalSessions).toFixed(1) : '0.0';
    const goldPercentage = totalArrows > 0 ? ((goldHits / totalArrows) * 100).toFixed(1) : '0.0';

    const maxCount = Math.max(...Object.values(scoreCounts));

    const chronologicalSessions = [...completedSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const trendData = chronologicalSessions.map(s => {
      const arrows = s.data.passes.flat();
      return arrows.length > 0 ? (s.totalScore / arrows.length) : 0;
    });

    const svgWidth = 280; const svgHeight = 100;
    const minY = Math.max(0, Math.floor(Math.min(...trendData) - 1)); 
    const maxY = 10; const range = (maxY - minY) || 1;

    const trendPoints = trendData.map((val, i) => {
      const x = trendData.length > 1 ? (i / (trendData.length - 1)) * svgWidth : svgWidth / 2;
      const y = svgHeight - ((val - minY) / range) * svgHeight;
      return `${x},${y}`;
    }).join(' ');

    // Berechne, wie viele Filter aktiv gesetzt sind (für den roten Punkt am Icon)
    const activeFilterCount = Object.values(statsFilter).filter(val => val !== 'all').length;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setCurrentView('dashboard')} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold text-gray-800">Gesamt-Auswertung</h1>
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className={`p-2 rounded-full relative transition-colors ${activeFilterCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            title="Filter ein/ausblenden"
          >
            <Filter size={20} />
            {activeFilterCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
        </header>

        <div className="p-4 flex-1 overflow-y-auto pb-20 space-y-6">
          
          {/* Filter-Menü (Ausklappbar) */}
          {isFilterOpen && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Filter size={16}/> Filter</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => setStatsFilter({ bowId: 'all', arrowId: 'all', distance: 'all', targetSize: 'all', rulesetId: 'all' })} className="text-xs text-red-500 font-bold hover:underline">
                    Zurücksetzen
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Bogen</label>
                  <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={statsFilter.bowId} onChange={e => setStatsFilter({...statsFilter, bowId: e.target.value})}>
                    <option value="all">Alle Bögen</option>
                    {globalSettings.bows.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Pfeil</label>
                  <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={statsFilter.arrowId} onChange={e => setStatsFilter({...statsFilter, arrowId: e.target.value})}>
                    <option value="all">Alle Pfeile</option>
                    {globalSettings.arrows.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Distanz</label>
                  <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={statsFilter.distance} onChange={e => setStatsFilter({...statsFilter, distance: e.target.value})}>
                    <option value="all">Alle Distanzen</option>
                    {globalSettings.distances.map(d => <option key={d} value={d}>{d} m</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Regelwerk</label>
                  <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" value={statsFilter.rulesetId} onChange={e => setStatsFilter({...statsFilter, rulesetId: e.target.value})}>
                    <option value="all">Alle Regeln</option>
                    {globalSettings.rulesets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {totalSessions === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Target size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-700 mb-1">Keine Daten gefunden</h3>
              <p className="text-sm text-gray-500">Es gibt keine abgeschlossenen Trainings, die auf deine aktuellen Filter zutreffen.</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Deine Meilensteine</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Trainings</p>
                    <p className="text-3xl font-black text-gray-800">{totalSessions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase">Pfeile Gesamt</p>
                    <p className="text-3xl font-black text-blue-600">{totalArrows}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl shadow-sm border border-green-200 text-center flex flex-col justify-center">
                    <p className="text-[10px] text-green-700 font-bold mb-1 uppercase leading-tight">Ø Pkt / Pfeil</p>
                    <p className="text-xl font-black text-green-800">{avgScorePerArrow}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl shadow-sm border border-blue-200 text-center flex flex-col justify-center">
                    <p className="text-[10px] text-blue-700 font-bold mb-1 uppercase leading-tight">Ø Pkt / Training</p>
                    <p className="text-xl font-black text-blue-800">{avgScorePerSession}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl shadow-sm border border-yellow-200 text-center flex flex-col justify-center">
                    <p className="text-[10px] text-yellow-700 font-bold mb-1 uppercase leading-tight">Gold-Quote</p>
                    <p className="text-xl font-black text-yellow-800">{goldPercentage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Leistungs-Trend</h3>
                {trendData.length >= 2 ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Ø Punkte pro Pfeil über deine letzten Trainings</p>
                    <div className="relative w-full h-[120px] bg-gray-50 rounded-lg border border-gray-100 p-2">
                      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                        <line x1="0" y1="0" x2={svgWidth} y2="0" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1={svgHeight/2} x2={svgWidth} y2={svgHeight/2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                        <text x="-5" y="4" fontSize="10" fill="#9ca3af" textAnchor="end">{maxY}</text>
                        <text x="-5" y={svgHeight/2 + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{(maxY+minY)/2}</text>
                        <text x="-5" y={svgHeight + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{minY}</text>
                        <polyline points={trendPoints} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {trendData.map((val, i) => (
                          <circle key={i} cx={(i / (trendData.length - 1)) * svgWidth} cy={svgHeight - ((val - minY) / range) * svgHeight} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                        ))}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Absolviere mindestens 2 Trainings in dieser Kategorie, um deinen Trend zu sehen.
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Crosshair size={20}/> Treffer-Heatmap</h3>
                <div className="flex justify-center">
                   <div className="relative w-full max-w-[280px] aspect-square rounded-full overflow-hidden border border-gray-200 bg-white">
                      <svg viewBox="-1 -1 2 2" className="w-full h-full">
                        <defs>
                          <filter id="heatmapFilterGlobal" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="0.025" result="blur1" />
                            <feColorMatrix in="blur1" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -5" result="blob" />
                            <feGaussianBlur in="blob" stdDeviation="0.008" result="blur2" />
                            <feColorMatrix in="blur2" type="matrix" values="0.6 0 0 0 0  0 0.1 0 0 0  0 0.1 0 0 0  0 0 0 40 -4" result="blobOuter" />
                            <feComposite in="blobOuter" in2="blob" operator="out" result="outline" />
                            <feMerge><feMergeNode in="blur1" /><feMergeNode in="outline" /></feMerge>
                          </filter>
                        </defs>
                        {renderTargetFace()}
                        <g filter="url(#heatmapFilterGlobal)">
                          {allPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.05" fill="#ef4444" opacity="0.6" />)}
                        </g>
                      </svg>
                   </div>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">Je roter der Bereich, desto häufiger hast du dort getroffen.</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Punkte-Verteilung (Gesamt)</h3>
                <div className="space-y-2">
                  {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(score => {
                    const count = scoreCounts[score];
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    let barColor = 'bg-gray-300';
                    if (score === '10' || score === '9') barColor = 'bg-yellow-400';
                    else if (score === '8' || score === '7') barColor = 'bg-red-500';
                    else if (score === '6' || score === '5') barColor = 'bg-blue-400';
                    else if (score === '4' || score === '3') barColor = 'bg-gray-800';
                    else if (score === '2' || score === '1') barColor = 'bg-gray-200 border border-gray-300';

                    return (
                      <div key={score} className="flex items-center gap-2 text-sm">
                        <div className="w-6 font-bold text-gray-600 text-right">{score}</div>
                        <div className="flex-1 bg-gray-50 rounded-r-md h-6 flex items-center relative">
                          <div className={`h-full rounded-r-md transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%`, minWidth: count > 0 ? '4px' : '0' }} />
                        </div>
                        <div className="w-10 text-right text-xs font-bold text-gray-500">{count}x</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col h-full bg-white">
      <header className="flex flex-col p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center mb-4">
          <button onClick={() => setCurrentView('dashboard')} className="mr-4 text-gray-600"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-bold text-gray-800">Einstellungen</h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setSettingsTab('rulesets')} className={`flex-1 py-2 text-sm font-bold rounded-md ${settingsTab === 'rulesets' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Regelwerke</button>
          <button onClick={() => setSettingsTab('bows')} className={`flex-1 py-2 text-sm font-bold rounded-md ${settingsTab === 'bows' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Bögen</button>
          <button onClick={() => setSettingsTab('arrows')} className={`flex-1 py-2 text-sm font-bold rounded-md ${settingsTab === 'arrows' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Pfeile</button>
        </div>
      </header>
      
      <div className="p-4 overflow-y-auto flex-1 pb-20">
        {settingsTab === 'rulesets' && (
          <div className="space-y-6">
            <ul className="space-y-3">
              {globalSettings.rulesets.map(r => (
                <li key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <strong className="text-sm text-gray-800 flex items-center gap-2">
                      {r.name} {userDefaults.rulesetId === r.id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Standard</span>}
                    </strong>
                    <span className="text-xs text-gray-500">{r.totalPasses} Passen á {r.arrowsPerPass} Pfeile</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setUserDefaults({...userDefaults, rulesetId: r.id})} className={`p-2 transition-colors ${userDefaults.rulesetId === r.id ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}><Star size={18} fill={userDefaults.rulesetId === r.id ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => { setRulesetForm({ name: r.name, arrowsPerPass: r.arrowsPerPass, totalPasses: r.totalPasses }); setEditingRulesetId(r.id); }} className="text-blue-400 p-2"><Pencil size={18} /></button>
                    {globalSettings.rulesets.length > 1 && <button onClick={() => deleteRuleset(r.id)} className="text-red-400 p-2"><Trash2 size={18} /></button>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">{editingRulesetId ? 'Regelwerk bearbeiten' : 'Neues Regelwerk'}</h4>
              <input type="text" placeholder="Name" className="w-full p-2 mb-3 bg-white border border-gray-200 rounded-lg text-sm" value={rulesetForm.name} onChange={(e) => setRulesetForm({...rulesetForm, name: e.target.value})} />
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Passen gesamt</label>
                  <input type="number" min="1" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={rulesetForm.totalPasses} onChange={(e) => setRulesetForm({...rulesetForm, totalPasses: parseInt(e.target.value) || 1})} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Pfeile / Passe</label>
                  <input type="number" min="1" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={rulesetForm.arrowsPerPass} onChange={(e) => setRulesetForm({...rulesetForm, arrowsPerPass: parseInt(e.target.value) || 1})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveRuleset} disabled={!rulesetForm.name.trim()} className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1"><Check size={16} /> {editingRulesetId ? 'Speichern' : 'Hinzufügen'}</button>
                {editingRulesetId && <button onClick={() => { setRulesetForm({ name: '', arrowsPerPass: 3, totalPasses: 10 }); setEditingRulesetId(null); }} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm font-bold">Abbrechen</button>}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Distanzen verwalten (m)</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {globalSettings.distances.map(d => (
                  <span key={d} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {d}m {globalSettings.distances.length > 1 && (<button onClick={() => setDeleteModal({type: 'distance', id: d, text: `${d}m Distanz löschen?`})} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={14}/></button>)}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" min="1" value={newDistance} onChange={e => setNewDistance(e.target.value)} placeholder="Neue Distanz in m" className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm" />
                <button onClick={addDistance} disabled={!newDistance} className="bg-green-100 text-green-700 px-4 rounded-lg font-bold disabled:opacity-50"><Plus size={16}/></button>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Auflagen verwalten (cm)</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {globalSettings.targetSizes.map(s => (
                  <span key={s} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {s}cm {globalSettings.targetSizes.length > 1 && (<button onClick={() => setDeleteModal({type: 'targetSize', id: s, text: `${s}cm Auflage löschen?`})} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={14}/></button>)}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" min="1" value={newTargetSize} onChange={e => setNewTargetSize(e.target.value)} placeholder="Neue Auflage in cm" className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm" />
                <button onClick={addTargetSize} disabled={!newTargetSize} className="bg-green-100 text-green-700 px-4 rounded-lg font-bold disabled:opacity-50"><Plus size={16}/></button>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'bows' && (
          <div className="space-y-6">
            <ul className="space-y-3">
              {globalSettings.bows.map(b => (
                <li key={b.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <strong className="text-sm text-gray-800 flex items-center gap-2">
                      {b.name} ({b.type}, {b.handedness}) {userDefaults.bowId === b.id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Standard</span>}
                    </strong>
                    <span className="text-xs text-gray-500 block">MS: {b.riserBrand} - {b.riserSystem}</span>
                    <span className="text-xs text-gray-500 block">WA: {b.limbBrand} ({b.drawWeight} lbs)</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => setUserDefaults({...userDefaults, bowId: b.id})} className={`p-2 transition-colors ${userDefaults.bowId === b.id ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}><Star size={18} fill={userDefaults.bowId === b.id ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => { setBowForm({ ...b }); setEditingBowId(b.id); }} className="text-blue-400 p-2"><Pencil size={18} /></button>
                    {globalSettings.bows.length > 1 && <button onClick={() => deleteBow(b.id)} className="text-red-400 p-2"><Trash2 size={18} /></button>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">{editingBowId ? 'Bogen bearbeiten' : 'Neuen Bogen anlegen'}</h4>
              <input type="text" placeholder="Bezeichnung (z.B. Mein Turnierbogen)" className="w-full p-2 mb-3 bg-white border border-gray-200 rounded-lg text-sm font-bold" value={bowForm.name} onChange={(e) => setBowForm({...bowForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bogenart</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.type} onChange={(e) => setBowForm({...bowForm, type: e.target.value})}>
                    <option value="Recurve">Recurve</option>
                    <option value="Blankbogen">Blankbogen</option>
                    <option value="Compound">Compound</option>
                    <option value="Langbogen">Langbogen</option>
                    <option value="Traditionell">Traditionell</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Handausführung</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.handedness || 'RH'} onChange={(e) => setBowForm({...bowForm, handedness: e.target.value})}>
                    <option value="RH">Rechtshand (RH)</option>
                    <option value="LH">Linkshand (LH)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mittelstück Marke</label>
                  <input type="text" placeholder="z.B. WNS..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.riserBrand} onChange={(e) => setBowForm({...bowForm, riserBrand: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Aufnahmesystem/Art</label>
                  <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.riserSystem} onChange={(e) => setBowForm({...bowForm, riserSystem: e.target.value})}>
                    <option value="ILF (Metall)">ILF (Metall)</option>
                    <option value="ILF (Holz)">ILF (Holz)</option>
                    <option value="Formula">Formula</option>
                    <option value="One-Piece">One-Piece (Holz)</option>
                    <option value="Compound">Compound</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Wurfarme Marke</label>
                  <input type="text" placeholder="z.B. Uukha..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.limbBrand} onChange={(e) => setBowForm({...bowForm, limbBrand: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Zuggewicht (lbs)</label>
                  <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={bowForm.drawWeight} onChange={(e) => setBowForm({...bowForm, drawWeight: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveBow} disabled={!bowForm.name.trim()} className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1"><Check size={16} /> Speichern</button>
                {editingBowId && <button onClick={() => { setBowForm(initialBowForm); setEditingBowId(null); }} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm font-bold">Abbrechen</button>}
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'arrows' && (
          <div className="space-y-6">
            <ul className="space-y-3">
              {globalSettings.arrows.map(a => (
                <li key={a.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <strong className="text-sm text-gray-800 flex items-center gap-2">
                      {a.name} {userDefaults.arrowId === a.id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Standard</span>}
                    </strong>
                    <span className="text-xs text-gray-500 block">{a.brand} | Spine: {a.spine} | {a.length}"</span>
                    <span className="text-xs text-gray-500 block">Nock: {a.nock} | Spitze: {a.pointWeight}gr ({a.pointType})</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => setUserDefaults({...userDefaults, arrowId: a.id})} className={`p-2 transition-colors ${userDefaults.arrowId === a.id ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}><Star size={18} fill={userDefaults.arrowId === a.id ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => { setArrowForm({ ...a }); setEditingArrowId(a.id); }} className="text-blue-400 p-2"><Pencil size={18} /></button>
                    {globalSettings.arrows.length > 1 && <button onClick={() => deleteArrow(a.id)} className="text-red-400 p-2"><Trash2 size={18} /></button>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">{editingArrowId ? 'Pfeil-Setup bearbeiten' : 'Neues Pfeil-Setup anlegen'}</h4>
              <input type="text" placeholder="Bezeichnung (z.B. Hallenpfeile)" className="w-full p-2 mb-3 bg-white border border-gray-200 rounded-lg text-sm font-bold" value={arrowForm.name} onChange={(e) => setArrowForm({...arrowForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Marke/Modell</label>
                  <input type="text" placeholder="z.B. Easton X7..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.brand} onChange={(e) => setArrowForm({...arrowForm, brand: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Spinewert</label>
                  <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.spine} onChange={(e) => setArrowForm({...arrowForm, spine: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Schaftlänge (Zoll)</label>
                  <input type="number" step="0.5" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.length} onChange={(e) => setArrowForm({...arrowForm, length: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nockenart</label>
                  <input type="text" placeholder="z.B. Pin-Nock..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.nock} onChange={(e) => setArrowForm({...arrowForm, nock: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Spitze (grain)</label>
                  <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.pointWeight} onChange={(e) => setArrowForm({...arrowForm, pointWeight: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Spitzenart</label>
                  <input type="text" placeholder="Klebespitze, Schraub..." className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={arrowForm.pointType} onChange={(e) => setArrowForm({...arrowForm, pointType: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveArrow} disabled={!arrowForm.name.trim()} className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1"><Check size={16} /> Speichern</button>
                {editingArrowId && <button onClick={() => { setArrowForm(initialArrowForm); setEditingArrowId(null); }} className="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg text-sm font-bold">Abbrechen</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-black flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md h-full bg-white shadow-2xl relative overflow-hidden flex flex-col">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'setup' && renderSetup()}
        {currentView === 'active' && renderActiveSession()}
        {currentView === 'stats' && renderStats()}
        {currentView === 'globalStats' && renderGlobalStats()}
        {currentView === 'settings' && renderSettings()}

        {deleteModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Bitte bestätigen</h3>
              <p className="text-gray-600 mb-6">{deleteModal.text}</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">Abbrechen</button>
                <button onClick={executeDelete} className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><Trash2 size={18}/> Löschen</button>
              </div>
            </div>
          </div>
        )}

        {weatherEditModal && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Ort & Wetter anpassen</h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">Ort</label>
                <input 
                  type="text" 
                  placeholder="z.B. Vereinsplatz, Bogenhalle..." 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" 
                  value={weatherEditModal.weatherData.location || ''} 
                  onChange={(e) => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, location: e.target.value}})} 
                />
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                <button onClick={() => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, isOutdoor: false}})} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${!weatherEditModal.weatherData.isOutdoor ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}><Home size={16}/> Halle</button>
                <button onClick={() => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, isOutdoor: true}})} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${weatherEditModal.weatherData.isOutdoor ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}><Sun size={16}/> Freiluft</button>
              </div>

              {weatherEditModal.weatherData.isOutdoor && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Bedingung</label>
                      <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={weatherEditModal.weatherData.condition} onChange={(e) => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, condition: e.target.value}})}>
                        <option value="sonnig">Sonnig</option>
                        <option value="bewoelkt">Bewölkt</option>
                        <option value="regen">Regen</option>
                        <option value="schnee">Schnee</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Thermometer size={12}/> Temp (°C)</label>
                      <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={weatherEditModal.weatherData.temperature} onChange={(e) => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, temperature: parseInt(e.target.value) || 0}})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Wind size={12}/> Wind (km/h)</label>
                      <input type="number" min="0" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={weatherEditModal.weatherData.windSpeed} onChange={(e) => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, windSpeed: parseInt(e.target.value) || 0}})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Compass size={12}/> Richtung</label>
                      <select className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm" value={weatherEditModal.weatherData.windDirection} onChange={(e) => setWeatherEditModal({...weatherEditModal, weatherData: {...weatherEditModal.weatherData, windDirection: e.target.value}})}>
                        <option value="N">N (Nord)</option>
                        <option value="NO">NO</option>
                        <option value="O">O (Ost)</option>
                        <option value="SO">SO</option>
                        <option value="S">S (Süd)</option>
                        <option value="SW">SW</option>
                        <option value="W">W (West)</option>
                        <option value="NW">NW</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setWeatherEditModal(null)} className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">Abbrechen</button>
                <button onClick={saveWeatherEdit} className="flex-1 p-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"><Check size={18}/> Speichern</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
