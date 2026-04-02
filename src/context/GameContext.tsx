import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface RoomConfig {
  id: string;
  name: string;
  password: string;
  points: number;
  timeMinutes: number;
  timeSeconds: number;
}

export interface IntelligenceConfig {
  gateCode: string;
  correctNumber: string;
  roomPassword: string;
  points: number;
  categories: { letter: string; name: string; items: string[] }[];
}

export interface TeamScore {
  teamName: string;
  rooms: Record<string, { completed: boolean; timeElapsed: number; points: number }>;
  totalPoints: number;
}

interface GameState {
  rooms: RoomConfig[];
  intelligence: IntelligenceConfig;
  teams: TeamScore[];
  currentTeam: string;
  adminPassword: string;
}

interface GameContextType {
  state: GameState;
  updateRoom: (roomId: string, config: Partial<RoomConfig>) => void;
  updateIntelligence: (config: Partial<IntelligenceConfig>) => void;
  addTeam: (name: string) => void;
  removeTeam: (name: string) => void;
  setCurrentTeam: (name: string) => void;
  awardPoints: (teamName: string, roomId: string, points: number, timeElapsed: number) => void;
  resetTeamScores: () => void;
  setAdminPassword: (pw: string) => void;
}

const DEFAULT_ROOMS: RoomConfig[] = [
  { id: 'strength', name: 'STRENGTH', password: 'DEIFIED', points: 100, timeMinutes: 6, timeSeconds: 0 },
  { id: 'strategy', name: 'STRATEGY', password: '', points: 100, timeMinutes: 6, timeSeconds: 0 },
  { id: 'memory', name: 'MEMORY', password: '', points: 100, timeMinutes: 6, timeSeconds: 0 },
  { id: 'intelligence', name: 'INTELLIGENCE', password: '', points: 100, timeMinutes: 6, timeSeconds: 0 },
  { id: 'stealth', name: 'STEALTH', password: '', points: 100, timeMinutes: 6, timeSeconds: 0 },
];

const DEFAULT_INTELLIGENCE: IntelligenceConfig = {
  gateCode: 'MONK',
  correctNumber: '9884512345',
  roomPassword: 'ENIGMA',
  points: 100,
  categories: [
    { letter: 'M', name: 'MAMMALS', items: ['Elephant', 'Whale', 'Lion', 'Bat'] },
    { letter: 'O', name: 'OCEANS', items: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] },
    { letter: 'N', name: 'NUMBERS', items: ['Pi', 'Infinity', 'Phi', 'Euler'] },
    { letter: 'K', name: 'KNIVES', items: ['Bowie', 'Swiss', 'Stiletto', 'Cleaver'] },
  ],
};

const DEFAULT_STATE: GameState = {
  rooms: DEFAULT_ROOMS,
  intelligence: DEFAULT_INTELLIGENCE,
  teams: [],
  currentTeam: '',
  adminPassword: 'admin',
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem('missionMayhemState');
    if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: GameState) {
  localStorage.setItem('missionMayhemState', JSON.stringify(state));
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const updateRoom = useCallback((roomId: string, config: Partial<RoomConfig>) => {
    setState(s => ({
      ...s,
      rooms: s.rooms.map(r => r.id === roomId ? { ...r, ...config } : r),
    }));
  }, []);

  const updateIntelligence = useCallback((config: Partial<IntelligenceConfig>) => {
    setState(s => ({ ...s, intelligence: { ...s.intelligence, ...config } }));
  }, []);

  const addTeam = useCallback((name: string) => {
    setState(s => {
      if (s.teams.find(t => t.teamName === name)) return s;
      return { ...s, teams: [...s.teams, { teamName: name, rooms: {}, totalPoints: 0 }] };
    });
  }, []);

  const removeTeam = useCallback((name: string) => {
    setState(s => ({ ...s, teams: s.teams.filter(t => t.teamName !== name) }));
  }, []);

  const setCurrentTeam = useCallback((name: string) => {
    setState(s => ({ ...s, currentTeam: name }));
  }, []);

  const awardPoints = useCallback((teamName: string, roomId: string, points: number, timeElapsed: number) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => {
        if (t.teamName !== teamName) return t;
        const newRooms = { ...t.rooms, [roomId]: { completed: true, timeElapsed, points } };
        const totalPoints = Object.values(newRooms).reduce((sum, r) => sum + r.points, 0);
        return { ...t, rooms: newRooms, totalPoints };
      }),
    }));
  }, []);

  const resetTeamScores = useCallback(() => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => ({ ...t, rooms: {}, totalPoints: 0 })),
    }));
  }, []);

  const setAdminPassword = useCallback((pw: string) => {
    setState(s => ({ ...s, adminPassword: pw }));
  }, []);

  return (
    <GameContext.Provider value={{
      state, updateRoom, updateIntelligence, addTeam, removeTeam,
      setCurrentTeam, awardPoints, resetTeamScores, setAdminPassword,
    }}>
      {children}
    </GameContext.Provider>
  );
}
