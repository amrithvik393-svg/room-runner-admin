import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { playSuccess, playFail, playMissionFailed } from '@/lib/sounds';
import { MissionFailedFlash } from '@/components/MissionFailedFlash';
import { getRoomColor } from '@/lib/roomColors';
import { startBgMusic, stopBgMusic } from '@/lib/bgMusic';

const RoomTimerPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { state, awardPoints } = useGame();
  const room = state.rooms.find(r => r.id === roomId);

  const [phase, setPhase] = useState<'timer' | 'success' | 'timeout'>('timer');
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [showFailFlash, setShowFailFlash] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const roomColor = getRoomColor(roomId || '');
  
  // Get per-room active team
  const activeTeam = room ? state.teams.find(t => t.id === room.activeTeamId) : undefined;
  const activeTeamName = activeTeam?.teamName || '';

  useEffect(() => {
    if (room) {
      const total = room.timeMinutes * 60 + room.timeSeconds;
      setTotalSeconds(total);
      setRemaining(total);
    }
  }, [room]);

  // Stop music on unmount
  useEffect(() => {
    return () => { stopBgMusic(); };
  }, []);

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = window.setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setShowFailFlash(true);
            stopBgMusic();
            playMissionFailed();
            setTimeout(() => {
              setShowFailFlash(false);
              setPhase('timeout');
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, paused]);

  const startTimer = useCallback(() => {
    const total = room ? room.timeMinutes * 60 + room.timeSeconds : 360;
    setTotalSeconds(total);
    setRemaining(total);
    setElapsed(0);
    setRunning(true);
    setPaused(false);
    setStarted(true);
    setPhase('timer');
    if (roomId) startBgMusic(roomId);
  }, [room, roomId]);

  const checkPassword = useCallback(() => {
    if (!room) return;
    const val = pwdInput.trim().toUpperCase();
    if (val === room.password.toUpperCase()) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setPhase('success');
      stopBgMusic();
      playSuccess();
      if (activeTeamName) {
        awardPoints(activeTeamName, room.id, room.points, elapsed);
      }
      setPwdInput('');
    } else {
      playFail();
      setPwdError('// INCORRECT PASSWORD');
      setPwdInput('');
      setTimeout(() => setPwdError(''), 1500);
    }
  }, [pwdInput, room, activeTeamName, elapsed, awardPoints]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPaused(false);
    setStarted(false);
    setPhase('timer');
    setPwdInput('');
    setPwdError('');
    setShowFailFlash(false);
    stopBgMusic();
    if (room) {
      const total = room.timeMinutes * 60 + room.timeSeconds;
      setTotalSeconds(total);
      setRemaining(total);
      setElapsed(0);
    }
  }, [room]);

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-24">
        <div className="text-destructive font-display tracking-[4px]">ROOM NOT FOUND</div>
      </div>
    );
  }

  const pct = totalSeconds > 0 ? remaining / totalSeconds : 1;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  // Color based on time + room theme
  const isLow = pct <= 0.15;
  const isMid = pct <= 0.33;
  const colorClass = isLow ? 'text-destructive animate-critical' : isMid ? 'text-warning' : roomColor.base;
  const barColor = isLow ? 'bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]' : isMid ? 'bg-warning shadow-[0_0_10px_hsl(var(--warning))]' : roomColor.bar;

  if (phase === 'success') {
    return (
      <div className="fixed inset-0 bg-background/95 flex flex-col items-center justify-center z-[9999] gap-5">
        <div className="text-[10px] tracking-[4px] text-secondary-foreground">{room.name} ROOM — PASSWORD ACCEPTED</div>
        <div className="h-0.5 bg-foreground shadow-[0_0_20px_hsl(var(--primary)),0_0_60px_hsl(var(--primary))] animate-flat-draw" />
        <div className="font-display text-[42px] font-black text-foreground tracking-[8px] text-center glow-green animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
          CLEARED
        </div>
        {activeTeamName && (
          <div className="text-[12px] text-secondary-foreground tracking-[3px] animate-fade-up" style={{ animationDelay: '0.8s', opacity: 0 }}>
            +{room.points} POINTS → {activeTeamName}
          </div>
        )}
        <div className="text-[12px] text-secondary-foreground tracking-[4px] text-center animate-fade-up" style={{ animationDelay: '1s', opacity: 0 }}>
          COMPLETED IN {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')} — TEAM ADVANCES
        </div>
        <button onClick={reset} className="mt-6 px-7 py-3 border border-muted-foreground text-muted-foreground font-display text-[11px] tracking-[3px] hover:border-secondary-foreground hover:text-secondary-foreground transition-all animate-fade-up" style={{ animationDelay: '1.5s', opacity: 0 }}>
          ↺ RUN NEXT ROOM
        </button>
        <Link to="/" className="text-muted-foreground text-[9px] tracking-[2px] hover:text-foreground mt-2">← BACK TO HUB</Link>
      </div>
    );
  }

  if (phase === 'timeout') {
    return (
      <div className="fixed inset-0 bg-[rgba(20,0,0,0.97)] flex flex-col items-center justify-center z-[9998] gap-4">
        <div className="font-display text-[52px] font-black text-destructive tracking-[6px] glow-red animate-critical">
          MISSION FAILED
        </div>
        <div className="text-[12px] text-destructive/60 tracking-[4px] text-center">{room.name} ROOM — TIME EXPIRED</div>
        <div className="text-[11px] text-destructive/30 tracking-[3px] mt-2">PROCEED TO OUTSIDE TASKS</div>
        <button onClick={reset} className="mt-8 px-7 py-3 border border-destructive/30 text-destructive font-display text-[11px] tracking-[3px] hover:border-destructive hover:text-destructive transition-all">
          ↺ RESET ROOM
        </button>
        <Link to="/" className="text-muted-foreground text-[9px] tracking-[2px] hover:text-foreground mt-2">← BACK TO HUB</Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 gap-6 px-6">
        <div className="font-display text-[13px] font-bold tracking-[5px] text-secondary-foreground text-center">
          {room.name} ROOM — READY
        </div>
        {activeTeamName && (
          <div className="text-[10px] tracking-[3px] text-muted-foreground">
            TEAM: <span className={roomColor.base}>{activeTeamName}</span> — {room.points} PTS
          </div>
        )}
        <div className="border border-border bg-card p-8 w-full max-w-md flex flex-col gap-5 panel-glow">
          <div className="text-center">
            <div className={`font-display text-5xl font-black tracking-[-2px] ${roomColor.base}`} style={{ textShadow: roomColor.glowLg }}>
              {String(room.timeMinutes).padStart(2, '0')}:{String(room.timeSeconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] tracking-[3px] text-muted-foreground mt-2">TIME LIMIT</div>
          </div>
          <button onClick={startTimer} className="w-full py-4 border border-foreground text-foreground font-display text-[13px] font-bold tracking-[5px] relative overflow-hidden group transition-all hover:text-background hover:shadow-[0_0_20px_hsl(var(--primary))]">
            <span className="absolute inset-0 bg-foreground transform -translate-x-full group-hover:translate-x-0 transition-transform z-0" />
            <span className="relative z-10">▶ INITIATE SEQUENCE</span>
          </button>
        </div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground">← BACK TO HUB</Link>
      </div>
    );
  }

  return (
    <>
      <MissionFailedFlash show={showFailFlash} />
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 gap-0 px-6">
        <div className="font-display text-[11px] tracking-[8px] text-secondary-foreground mb-2 text-center">{room.name} ROOM</div>
        <div className={`font-display font-black leading-none tracking-[-2px] text-center transition-all duration-500 ${colorClass}`} style={{ fontSize: 'clamp(72px, 18vw, 160px)', textShadow: isLow ? undefined : isMid ? undefined : roomColor.glowLg }}>
          {timeStr}
        </div>
        <div className="text-muted-foreground text-[20px] tracking-[4px] text-center -mt-1 mb-5">
          {elapsed}s elapsed — {remaining}s remaining
        </div>
        <div className="w-[60%] h-[3px] bg-muted-foreground mb-8 relative">
          <div className={`h-full transition-all duration-1000 linear ${barColor}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="flex flex-col items-center gap-2.5 w-[360px] max-w-full">
          <div className="text-[9px] tracking-[4px] text-muted-foreground text-center">ENTER ROOM PASSWORD TO STOP TIMER</div>
          <div className="flex w-full">
            <input type="text" value={pwdInput} onChange={e => setPwdInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') checkPassword(); }} placeholder="_ _ _ _ _ _" maxLength={20} className="flex-1 bg-background border border-muted-foreground border-r-0 text-foreground font-display text-lg p-2.5 tracking-[5px] uppercase text-center outline-none focus:border-foreground" />
            <button onClick={checkPassword} className="px-5 py-2.5 bg-muted-foreground border border-muted-foreground text-background font-display text-[11px] font-bold tracking-[2px] hover:bg-foreground hover:border-foreground hover:shadow-[0_0_15px_hsl(var(--primary))] transition-all">CONFIRM</button>
          </div>
          <div className="text-destructive text-[10px] tracking-[2px] text-center min-h-[14px]">{pwdError}</div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setPaused(p => !p)} className="px-5 py-2 border border-muted-foreground text-secondary-foreground text-[11px] tracking-[2px] hover:border-secondary-foreground hover:text-foreground transition-all">
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button onClick={reset} className="px-5 py-2 border border-muted-foreground text-secondary-foreground text-[11px] tracking-[2px] hover:border-secondary-foreground hover:text-foreground transition-all">↺ RESET</button>
        </div>
      </div>
    </>
  );
};

export default RoomTimerPage;
