import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoomConfig {
  id: string;
  name: string;
  password: string;
  points: number;
  timeMinutes: number;
  timeSeconds: number;
  volunteerName: string;
}

export interface IntelligenceConfig {
  gateCode: string;
  correctNumber: string;
  roomPassword: string;
  points: number;
  timeMinutes: number;
  timeSeconds: number;
  categories: { letter: string; name: string; items: string[] }[];
}

export interface BossConfig {
  password: string;
  vitalHr: number;
  vitalBp: number;
  vitalO2: number;
  vitalNr: number;
  points: number;
  timeMinutes: number;
  timeSeconds: number;
}

export interface TeamMember {
  member1: string;
  member2: string;
  member3: string;
  member4: string;
}

export interface TeamScore {
  id: string;
  teamName: string;
  members: TeamMember;
  rooms: Record<string, { completed: boolean; timeElapsed: number; points: number }>;
  totalPoints: number;
}

export interface PointAdjustment {
  id: string;
  teamId: string;
  adjustedBy: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface GameState {
  rooms: RoomConfig[];
  intelligence: IntelligenceConfig;
  boss: BossConfig;
  teams: TeamScore[];
  currentTeam: string;
  adminPassword: string;
  adjustments: PointAdjustment[];
  loaded: boolean;
}

interface GameContextType {
  state: GameState;
  updateRoom: (roomId: string, config: Partial<RoomConfig>) => void;
  updateIntelligence: (config: Partial<IntelligenceConfig>) => void;
  updateBoss: (config: Partial<BossConfig>) => void;
  addTeam: (name: string, members?: TeamMember) => void;
  removeTeam: (name: string) => void;
  updateTeamMembers: (teamName: string, members: TeamMember) => void;
  setCurrentTeam: (name: string) => void;
  awardPoints: (teamName: string, roomId: string, points: number, timeElapsed: number) => void;
  adjustPoints: (teamName: string, adjustedBy: string, points: number, reason: string) => void;
  resetTeamScores: () => void;
  setAdminPassword: (pw: string) => void;
  refreshData: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>({
    rooms: [],
    intelligence: { gateCode: 'MONK', correctNumber: '9884512345', roomPassword: 'ENIGMA', points: 100, timeMinutes: 6, timeSeconds: 0, categories: [] },
    boss: { password: 'GENESIS', vitalHr: 57, vitalBp: 145, vitalO2: 91, vitalNr: 44, points: 200, timeMinutes: 10, timeSeconds: 0 },
    teams: [],
    currentTeam: '',
    adminPassword: 'admin',
    adjustments: [],
    loaded: false,
  });
  const refreshRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      // Load config
      const { data: config } = await supabase.from('game_config').select('*').eq('id', 'main').single();
      // Load rooms
      const { data: rooms } = await supabase.from('rooms').select('*').order('sort_order');
      // Load teams
      const { data: teams } = await supabase.from('teams').select('*');
      // Load scores
      const { data: scores } = await supabase.from('team_scores').select('*');
      // Load adjustments
      const { data: adjustments } = await supabase.from('point_adjustments').select('*').order('created_at', { ascending: false });

      if (!config || !rooms) return;

      const categories = (config.intelligence_categories as any[]) || [];

      const teamList: TeamScore[] = (teams || []).map(t => {
        const teamScores = (scores || []).filter(s => s.team_id === t.id);
        const roomMap: Record<string, { completed: boolean; timeElapsed: number; points: number }> = {};
        teamScores.forEach(s => {
          roomMap[s.room_id] = { completed: s.completed || false, timeElapsed: s.time_elapsed || 0, points: s.points || 0 };
        });
        const teamAdjustments = (adjustments || []).filter(a => a.team_id === t.id);
        const adjustmentTotal = teamAdjustments.reduce((sum, a) => sum + a.points, 0);
        const scoreTotal = Object.values(roomMap).reduce((sum, r) => sum + r.points, 0);
        return {
          id: t.id,
          teamName: t.team_name,
          members: { member1: t.member1 || '', member2: t.member2 || '', member3: t.member3 || '', member4: t.member4 || '' },
          rooms: roomMap,
          totalPoints: scoreTotal + adjustmentTotal,
        };
      });

      setState({
        rooms: rooms.map(r => ({
          id: r.id, name: r.name, password: r.password || '',
          points: r.points || 100, timeMinutes: r.time_minutes || 6,
          timeSeconds: r.time_seconds || 0, volunteerName: r.volunteer_name || '',
        })),
        intelligence: {
          gateCode: config.intelligence_gate_code || 'MONK',
          correctNumber: config.intelligence_correct_number || '',
          roomPassword: config.intelligence_room_password || '',
          points: config.intelligence_points || 100,
          timeMinutes: config.intelligence_time_minutes || 6,
          timeSeconds: config.intelligence_time_seconds || 0,
          categories,
        },
        boss: {
          password: config.boss_room_password || 'GENESIS',
          vitalHr: config.boss_vital_hr || 57,
          vitalBp: config.boss_vital_bp || 145,
          vitalO2: config.boss_vital_o2 || 91,
          vitalNr: config.boss_vital_nr || 44,
          points: config.boss_points || 200,
          timeMinutes: config.boss_time_minutes || 10,
          timeSeconds: config.boss_time_seconds || 0,
        },
        teams: teamList,
        currentTeam: config.current_team || '',
        adminPassword: config.admin_password || 'admin',
        adjustments: (adjustments || []).map(a => ({
          id: a.id, teamId: a.team_id, adjustedBy: a.adjusted_by,
          points: a.points, reason: a.reason || '', createdAt: a.created_at || '',
        })),
        loaded: true,
      });
    } catch (err) {
      console.error('Failed to load game data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes
    const channel = supabase.channel('game-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_config' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_scores' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'point_adjustments' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const updateRoom = useCallback(async (roomId: string, config: Partial<RoomConfig>) => {
    const update: any = {};
    if (config.password !== undefined) update.password = config.password;
    if (config.points !== undefined) update.points = config.points;
    if (config.timeMinutes !== undefined) update.time_minutes = config.timeMinutes;
    if (config.timeSeconds !== undefined) update.time_seconds = config.timeSeconds;
    if (config.volunteerName !== undefined) update.volunteer_name = config.volunteerName;
    if (config.name !== undefined) update.name = config.name;
    await supabase.from('rooms').update(update).eq('id', roomId);
  }, []);

  const updateIntelligence = useCallback(async (config: Partial<IntelligenceConfig>) => {
    const update: any = {};
    if (config.gateCode !== undefined) update.intelligence_gate_code = config.gateCode;
    if (config.correctNumber !== undefined) update.intelligence_correct_number = config.correctNumber;
    if (config.roomPassword !== undefined) update.intelligence_room_password = config.roomPassword;
    if (config.points !== undefined) update.intelligence_points = config.points;
    if (config.timeMinutes !== undefined) update.intelligence_time_minutes = config.timeMinutes;
    if (config.timeSeconds !== undefined) update.intelligence_time_seconds = config.timeSeconds;
    if (config.categories !== undefined) update.intelligence_categories = config.categories;
    await supabase.from('game_config').update(update).eq('id', 'main');
  }, []);

  const updateBoss = useCallback(async (config: Partial<BossConfig>) => {
    const update: any = {};
    if (config.password !== undefined) update.boss_room_password = config.password;
    if (config.vitalHr !== undefined) update.boss_vital_hr = config.vitalHr;
    if (config.vitalBp !== undefined) update.boss_vital_bp = config.vitalBp;
    if (config.vitalO2 !== undefined) update.boss_vital_o2 = config.vitalO2;
    if (config.vitalNr !== undefined) update.boss_vital_nr = config.vitalNr;
    if (config.points !== undefined) update.boss_points = config.points;
    if (config.timeMinutes !== undefined) update.boss_time_minutes = config.timeMinutes;
    if (config.timeSeconds !== undefined) update.boss_time_seconds = config.timeSeconds;
    await supabase.from('game_config').update(update).eq('id', 'main');
  }, []);

  const addTeam = useCallback(async (name: string, members?: TeamMember) => {
    await supabase.from('teams').insert({
      team_name: name.toUpperCase(),
      member1: members?.member1 || '',
      member2: members?.member2 || '',
      member3: members?.member3 || '',
      member4: members?.member4 || '',
    });
  }, []);

  const removeTeam = useCallback(async (name: string) => {
    await supabase.from('teams').delete().eq('team_name', name);
  }, []);

  const updateTeamMembers = useCallback(async (teamName: string, members: TeamMember) => {
    await supabase.from('teams').update({
      member1: members.member1,
      member2: members.member2,
      member3: members.member3,
      member4: members.member4,
    }).eq('team_name', teamName);
  }, []);

  const setCurrentTeam = useCallback(async (name: string) => {
    await supabase.from('game_config').update({ current_team: name }).eq('id', 'main');
  }, []);

  const awardPoints = useCallback(async (teamName: string, roomId: string, points: number, timeElapsed: number) => {
    const team = state.teams.find(t => t.teamName === teamName);
    if (!team) return;
    await supabase.from('team_scores').upsert({
      team_id: team.id,
      room_id: roomId,
      completed: true,
      time_elapsed: timeElapsed,
      points,
    }, { onConflict: 'team_id,room_id' });
  }, [state.teams]);

  const adjustPoints = useCallback(async (teamName: string, adjustedBy: string, points: number, reason: string) => {
    const team = state.teams.find(t => t.teamName === teamName);
    if (!team) return;
    await supabase.from('point_adjustments').insert({
      team_id: team.id,
      adjusted_by: adjustedBy,
      points,
      reason,
    });
  }, [state.teams]);

  const resetTeamScores = useCallback(async () => {
    for (const team of state.teams) {
      await supabase.from('team_scores').delete().eq('team_id', team.id);
      await supabase.from('point_adjustments').delete().eq('team_id', team.id);
    }
  }, [state.teams]);

  const setAdminPassword = useCallback(async (pw: string) => {
    await supabase.from('game_config').update({ admin_password: pw }).eq('id', 'main');
  }, []);

  return (
    <GameContext.Provider value={{
      state, updateRoom, updateIntelligence, updateBoss, addTeam, removeTeam,
      updateTeamMembers, setCurrentTeam, awardPoints, adjustPoints, resetTeamScores,
      setAdminPassword, refreshData: loadData,
    }}>
      {children}
    </GameContext.Provider>
  );
}
