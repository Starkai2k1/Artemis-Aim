import React, { useState } from 'react';
import { Check, PauseCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useArcheryData } from '../../context/ArcheryContext';
import { calculateScore, calculateSessionStats } from '../../utils/scoring';
import { TargetFace } from '../shared/TargetFace';

export const ActiveSession = ({ onBack }) => {
  const { 
    activeSession, 
    setActiveSession, 
    sessions, 
    setSessions, 
    globalSettings 
  } = useArcheryData();

  const [dragState, setDragState] = useState(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  if (!activeSession) return null;

  const { config, data } = activeSession;
  const ruleset = globalSettings.rulesets.find(r => r.id === config.rulesetId);
  const currentPass = data.passes[data.currentPassIndex] || [];
  const isLastPass = data.currentPassIndex >= ruleset.totalPasses - 1;

  // Summen berechnen
  const passSum = currentPass.reduce((sum, arrow) => sum + (arrow.score === 'M' ? 0 : arrow.score), 0);
  const totalSum = data.passes.flat().reduce((sum, arrow) => sum + (arrow.score === 'M' ? 0 : arrow.score), 0);

  // --- Pointer Logic ---
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

  const handlePointerMove = (e) => {
    if (dragState) updateDragPos(e, dragState.rect);
  };

  const handlePointerUp = (e) => {
    if (!dragState) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const score = calculateScore(dragState.x, dragState.y);
    
    const newPasses = [...data.passes];
    newPasses[data.currentPassIndex] = [...currentPass, { x: dragState.x, y: dragState.y, score }];
    
    setActiveSession({
      ...activeSession,
      data: { ...data, passes: newPasses }
    });
    setDragState(null);
  };

  const nextPass = () => {
    if (!isLastPass) {
      setActiveSession({
        ...activeSession,
        data: { 
          ...data, 
          passes: [...data.passes, []], 
          currentPassIndex: data.currentPassIndex + 1 
        }
      });
    }
  };

  const confirmEndSession = (status) => {
    const { totalScore, average } = calculateSessionStats(data.passes);
    const completedSession = {
      ...activeSession,
      totalScore,
      average,
      status: status // 'completed' oder 'paused'
    };

    setSessions([completedSession, ...sessions]);
    setActiveSession(null);
    onBack(); // Zurück zum Dashboard
  };

  const deleteArrow = (idx) => {
    const newPasses = [...data.passes];
    newPasses[data.currentPassIndex] = currentPass.filter((_, i) => i !== idx);
    setActiveSession({
      ...activeSession,
      data: { ...data, passes: newPasses }
    });
    setDeleteModal(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white relative">
      <header className="flex justify-between items-center p-4 bg-gray-800">
        <div>
          <p className="text-xs text-gray-400">Passe {data.currentPassIndex + 1} / {ruleset.totalPasses}</p>
          <h2 className="text-xl font-bold">Gesamt: {totalSum}</h2>
        </div>
        <button onClick={() => setEndModalVisible(true)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Beenden</button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-gray-300 text-sm">Ziehen zum Zielen</p>
        <div 
          className="relative w-full max-w-[300px] aspect-square rounded-full overflow-hidden shadow-2xl cursor-crosshair bg-white touch-none select-none"
          onPointerDown={handlePointerDown} 
          onPointerMove={handlePointerMove} 
          onPointerUp={handlePointerUp}
        >
          <svg viewBox="-1 -1 2 2" className="w-full h-full pointer-events-none"><TargetFace /></svg>
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
          <h3 className="font-bold text-sm">Aktuelle Passe</h3>
          <span className="bg-gray-700 px-3 py-1 rounded-full text-xs">Summe: {passSum}</span>
        </div>
        <div className="flex gap-2 justify-center mb-6 h-12">
          {[...Array(ruleset.arrowsPerPass)].map((_, i) => (
            <div 
              key={i} 
              onClick={() => currentPass[i] && setDeleteModal(i)} 
              className={`flex-1 max-w-[3rem] rounded-lg flex items-center justify-center font-bold text-xl border border-gray-600 transition-colors ${currentPass[i] ? 'bg-gray-700 cursor-pointer' : 'bg-gray-800'}`}
            >
              {currentPass[i] ? currentPass[i].score : '-'}
            </div>
          ))}
        </div>
        <button 
          onClick={isLastPass ? () => setEndModalVisible(true) : nextPass} 
          disabled={currentPass.length < ruleset.arrowsPerPass} 
          className={`w-full p-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${currentPass.length < ruleset.arrowsPerPass ? 'bg-gray-700 text-gray-500' : isLastPass ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {isLastPass ? 'Training abschließen' : 'Nächste Passe'} <Check size={20} />
        </button>
      </div>

      {/* Magnifier Effect */}
      {dragState && (
        <div className="fixed z-50 w-32 h-32 bg-white rounded-full border-4 border-gray-800 shadow-2xl overflow-hidden pointer-events-none" style={{ left: dragState.clientX, top: dragState.clientY, transform: 'translate(-50%, -130%)' }}>
          <div className="absolute" style={{ width: dragState.rect.width * 2.5, height: dragState.rect.height * 2.5, left: 64 - (((dragState.x + 1) / 2) * (dragState.rect.width * 2.5)), top: 64 - (((dragState.y + 1) / 2) * (dragState.rect.height * 2.5)) }}>
            <svg viewBox="-1 -1 2 2" className="w-full h-full"><TargetFace /></svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-80">
             <div className="w-10 h-[2px] bg-gray-900 absolute"></div>
             <div className="h-10 w-[2px] bg-gray-900 absolute"></div>
             <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white absolute"></div>
          </div>
        </div>
      )}

      {/* Modals (End Session / Delete Arrow) */}
      {endModalVisible && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-2">Beenden</h3>
            <p className="text-gray-400 mb-6 text-sm">Möchtest du das Training speichern oder nur pausieren?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => confirmEndSession('completed')} className="w-full p-3 bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center gap-2"><Check size={18}/> Speichern</button>
              <button onClick={() => confirmEndSession('paused')} className="w-full p-3 bg-orange-500/20 text-orange-400 font-bold rounded-lg flex justify-center items-center gap-2"><PauseCircle size={18}/> Pausieren</button>
              <button onClick={() => setEndModalVisible(false)} className="w-full p-3 bg-gray-700 text-gray-300 font-bold rounded-lg mt-2">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal !== null && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pfeil löschen?</h3>
            <p className="text-gray-600 mb-6">Soll dieser Treffer wirklich entfernt werden?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 bg-gray-100 text-gray-700 font-bold rounded-lg">Abbrechen</button>
              <button onClick={() => deleteArrow(deleteModal)} className="flex-1 p-3 bg-red-500 text-white font-bold rounded-lg flex justify-center items-center gap-2"><Trash2 size={18}/> Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
