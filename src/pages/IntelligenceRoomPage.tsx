import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';

const DTMF: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

const TONES = [
  { num: '1', freqs: '697 + 1209 Hz' }, { num: '2', freqs: '697 + 1336 Hz' }, { num: '3', freqs: '697 + 1477 Hz' },
  { num: '4', freqs: '770 + 1209 Hz' }, { num: '5', freqs: '770 + 1336 Hz' }, { num: '6', freqs: '770 + 1477 Hz' },
  { num: '7', freqs: '852 + 1209 Hz' }, { num: '8', freqs: '852 + 1336 Hz' }, { num: '9', freqs: '852 + 1477 Hz' },
  { num: '*', freqs: '941 + 1209 Hz' }, { num: '0', freqs: '941 + 1336 Hz' }, { num: '#', freqs: '941 + 1477 Hz' },
];

const KEY_LABELS: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ', '0': '+' };

const IntelligenceRoomPage = () => {
  const { state, awardPoints } = useGame();
  const intel = state.intelligence;
  const [screen, setScreen] = useState<'gate' | 'phone'>('gate');
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [dialString, setDialString] = useState('');
  const [callResult, setCallResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [awarded, setAwarded] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((key: string) => {
    const freqs = DTMF[key];
    if (!freqs) return;
    const ctx = getAudioCtx();
    const dur = 0.15;
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    });
  }, [getAudioCtx]);

  const checkGate = useCallback(() => {
    if (gateInput.trim().toUpperCase() === intel.gateCode.toUpperCase()) {
      setScreen('phone');
    } else {
      setGateError('// ACCESS DENIED — CHECK YOUR CATEGORY INITIALS');
      setGateInput('');
      setTimeout(() => setGateError(''), 2000);
    }
  }, [gateInput, intel.gateCode]);

  const pressKey = useCallback((k: string) => {
    if (dialString.length >= 15) return;
    setDialString(prev => prev + k);
    playTone(k);
  }, [dialString, playTone]);

  const makeCall = useCallback(() => {
    if (dialString.replace(/\s/g, '') === intel.correctNumber) {
      setCallResult('correct');
      if (state.currentTeam && !awarded) {
        // Find the intelligence room config for points
        const intelRoom = state.rooms.find(r => r.id === 'intelligence');
        awardPoints(state.currentTeam, 'intelligence-task', intel.points || intelRoom?.points || 100, 0);
        setAwarded(true);
      }
    } else {
      setCallResult('wrong');
      setTimeout(() => setCallResult('none'), 3000);
    }
  }, [dialString, intel, state.currentTeam, state.rooms, awarded, awardPoints]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-card">
        <div className="font-display font-black text-base tracking-[4px] text-foreground glow-green">INTELLIGENCE ROOM</div>
        <div className="text-[10px] tracking-[3px] text-secondary-foreground">TASK 2 — SIGNAL INTERCEPT</div>
      </div>

      {screen === 'gate' ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] gap-6 px-6">
          <div className="font-display text-[14px] tracking-[5px] text-secondary-foreground text-center">CLASSIFIED ACCESS — LEVEL 2</div>
          <div className="border border-border p-8 w-full max-w-[420px] bg-card flex flex-col gap-4">
            <div className="text-[11px] text-muted-foreground tracking-[1px] leading-[1.8] border-l-2 border-muted-foreground pl-3">
              You have completed the Connections analysis.<br />
              The first letters of your four categories form the unlock key.<br /><br />
              Enter the 4-letter code to access the signal intercept terminal.
            </div>
            <input
              type="text"
              value={gateInput}
              onChange={e => setGateInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') checkGate(); }}
              maxLength={4}
              placeholder="_ _ _ _"
              className="w-full bg-background border border-muted-foreground text-foreground font-display text-2xl p-2.5 tracking-[8px] text-center outline-none uppercase focus:border-foreground focus:shadow-[0_0_15px_hsla(152,100%,50%,0.15)]"
            />
            <button
              onClick={checkGate}
              className="w-full py-3 border border-foreground text-foreground font-display text-[12px] tracking-[4px] hover:bg-foreground hover:text-background hover:shadow-[0_0_20px_hsl(var(--primary))] transition-all"
            >
              UNLOCK TERMINAL
            </button>
            {gateError && <div className="text-destructive text-[10px] tracking-[2px] text-center">{gateError}</div>}
          </div>
          <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground">← BACK TO HUB</Link>
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 px-6 gap-8">
          <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground text-center">SIGNAL INTERCEPT TERMINAL</div>

          {/* Mission brief */}
          <div className="max-w-[600px] w-full border border-border p-5 bg-card text-[12px] tracking-[1px] leading-[2] text-secondary-foreground">
            <span className="text-foreground font-bold">MISSION BRIEFING:</span> Our analysts have intercepted a transmission
            from the scientist's network. The message is encoded as <span className="text-foreground font-bold">old Nokia keypad tones</span> —
            the kind used in T9 phones.<br /><br />
            A volunteer will <span className="text-foreground font-bold">play the tones</span> for your team. Each tone corresponds to
            a digit (0–9). Decode the sequence, then <span className="text-foreground font-bold">dial the number on the keypad below</span>
            &nbsp;and press CALL.
          </div>

          {/* Phone panel */}
          <div className="bg-card border border-border p-7 flex flex-col items-center gap-5 w-full max-w-[340px] panel-glow">
            <div className="text-[9px] tracking-[3px] text-muted-foreground">SECURE DIAL TERMINAL</div>
            <div className="w-full bg-background border border-muted-foreground p-3.5 text-center font-display text-[28px] tracking-[8px] text-foreground min-h-[56px] glow-green">
              {dialString || '_'}
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                <button
                  key={k}
                  onClick={() => pressKey(k)}
                  className="py-4 bg-background border border-muted-foreground text-foreground font-display text-lg flex flex-col items-center gap-0.5 hover:border-foreground hover:shadow-[0_0_10px_hsla(152,100%,50%,0.2)] active:bg-foreground/10 transition-all"
                >
                  {k}
                  {KEY_LABELS[k] && <span className="text-[7px] tracking-[2px] text-muted-foreground font-mono">{KEY_LABELS[k]}</span>}
                </button>
              ))}
              <button
                onClick={() => setDialString(prev => prev.slice(0, -1))}
                className="py-4 bg-background border border-destructive/30 text-destructive font-display text-lg hover:border-destructive hover:shadow-[0_0_10px_hsla(348,100%,60%,0.2)] transition-all"
              >
                ⌫
              </button>
              <button
                onClick={() => pressKey('0')}
                className="py-4 bg-background border border-muted-foreground text-foreground font-display text-lg flex flex-col items-center gap-0.5 hover:border-foreground hover:shadow-[0_0_10px_hsla(152,100%,50%,0.2)] active:bg-foreground/10 transition-all"
              >
                0<span className="text-[7px] tracking-[2px] text-muted-foreground font-mono">+</span>
              </button>
              <button
                onClick={makeCall}
                className="py-4 bg-foreground/10 border border-foreground text-foreground font-display text-sm tracking-[2px] hover:bg-foreground hover:text-background hover:shadow-[0_0_20px_hsl(var(--primary))] transition-all"
              >
                CALL
              </button>
            </div>
          </div>

          {/* Tone reference */}
          <div className="w-full max-w-[600px] bg-card border border-border p-6">
            <div className="text-[9px] tracking-[4px] text-muted-foreground mb-4">NOKIA DTMF TONE REFERENCE — USE THIS TO DECODE THE AUDIO</div>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <div key={t.num} className="border border-border p-2.5 text-center">
                  <div className="font-display text-xl text-foreground">{t.num}</div>
                  <div className="text-[9px] text-muted-foreground tracking-[1px] mt-1">{t.freqs}</div>
                  <button
                    onClick={() => playTone(t.num)}
                    className="mt-1.5 px-2 py-1 border border-muted-foreground text-secondary-foreground text-[9px] tracking-[1px] w-full hover:border-foreground hover:text-foreground transition-all"
                  >
                    ▶ PLAY
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Call results */}
          {callResult === 'wrong' && (
            <div className="text-destructive text-[11px] tracking-[2px] text-center">
              // NO ANSWER — WRONG NUMBER. CHECK YOUR DECODING.
            </div>
          )}
          {callResult === 'correct' && (
            <div className="w-full max-w-[600px] border border-foreground p-6 bg-foreground/5 text-center">
              <div className="font-display text-[12px] tracking-[4px] text-foreground mb-3">📞 CALL CONNECTED — VOICE MESSAGE RECEIVED</div>
              <div className="text-[13px] leading-[2] tracking-[1px] text-secondary-foreground">
                <em>"You've reached the right line, agent. Here is your clearance word."</em>
              </div>
              <div className="font-display text-2xl text-foreground tracking-[8px] glow-green mt-3">
                {intel.roomPassword}
              </div>
              {state.currentTeam && awarded && (
                <div className="text-[11px] tracking-[3px] text-secondary-foreground mt-3">
                  +{intel.points} POINTS → {state.currentTeam}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground tracking-[2px] mt-3">
                WRITE THIS DOWN. PRESENT IT AT THE ROOM EXIT.
              </div>
            </div>
          )}

          <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground mt-4">← BACK TO HUB</Link>
        </div>
      )}
    </div>
  );
};

export default IntelligenceRoomPage;
