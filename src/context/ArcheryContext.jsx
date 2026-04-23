import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_GLOBAL_SETTINGS, DEFAULT_USER_SETTINGS } from '../constants/initialData';

const ArcheryContext = createContext();

export const ArcheryProvider = ({ children }) => {
  const [globalSettings, setGlobalSettings] = useLocalStorage('archery_global_settings_v4', INITIAL_GLOBAL_SETTINGS);
  const [userDefaults, setUserDefaults] = useLocalStorage('archery_user_defaults_v4', DEFAULT_USER_SETTINGS);
  const [sessions, setSessions] = useLocalStorage('archery_saved_sessions_v4', []);

  // Shared state for the active session (not persisted until saved/paused)
  const [activeSession, setActiveSession] = useState(null);

  const value = {
    globalSettings,
    setGlobalSettings,
    userDefaults,
    setUserDefaults,
    sessions,
    setSessions,
    activeSession,
    setActiveSession
  };

  return <ArcheryContext.Provider value={value}>{children}</ArcheryContext.Provider>;
};

export const useArcheryData = () => {
  const context = useContext(ArcheryContext);
  if (!context) {
    throw new Error('useArcheryData must be used within an ArcheryProvider');
  }
  return context;
};
