import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const { state, updateRoom, updateIntelligence, updateBoss, addTeam, removeTeam, updateTeamMembers, setCurrentTeam, resetTeamScores, setAdminPassword } = useGame();
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newMembers, setNewMembers] = useState({ member1: '', member2: '', member3: '', member4: '' });
  const [newAdminPw, setNewAdminPw] = useState('');
  const [editingMembers, setEditingMembers] = useState<string | null>(null);
  const [editMembers, setEditMembers] = useState({ member1: '', member2: '', member3: '', member4: '' });

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 gap-6 px-6">
        <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground">ADMIN ACCESS</div>
        <div className="border border-border bg-card p-8 w-full max-w-md flex flex-col gap-4 panel-glow">
          <label className="text-[9px] tracking-[3px] text-secondary-foreground">ADMIN PASSWORD</label>
          <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { if (pwInput === state.adminPassword) setAuthed(true); else { setPwError('// ACCESS DENIED'); setTimeout(() => setPwError(''), 1500); setPwInput(''); } } }} className="w-full bg-background border border-muted-foreground text-foreground font-display text-xl p-3 tracking-[4px] text-center outline-none focus:border-foreground focus:shadow-[0_0_15px_hsla(152,100%,50%,0.15)]" />
          <button onClick={() => { if (pwInput === state.adminPassword) setAuthed(true); else { setPwError('// ACCESS DENIED'); setTimeout(() => setPwError(''), 1500); setPwInput(''); } }} className="w-full py-3 border border-foreground text-foreground font-display text-[12px] tracking-[4px] hover:bg-foreground hover:text-background transition-all">AUTHENTICATE</button>
          {pwError && <div className="text-destructive text-[10px] tracking-[2px] text-center">{pwError}</div>}
        </div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground">← BACK TO HUB</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground">ADMIN CONTROL PANEL</div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground border border-border px-4 py-2">← HUB</Link>
      </div>

      {/* Team Management */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">TEAM MANAGEMENT</div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-3">
            <input type="text" value={newTeam} onChange={e => setNewTeam(e.target.value)} placeholder="TEAM NAME" className="flex-1 bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[3px] text-center outline-none focus:border-foreground uppercase" />
            <button onClick={() => { if (newTeam.trim()) { addTeam(newTeam.trim().toUpperCase(), newMembers); setNewTeam(''); setNewMembers({ member1: '', member2: '', member3: '', member4: '' }); } }} className="px-4 py-2 border border-foreground text-foreground font-display text-[10px] tracking-[2px] hover:bg-foreground hover:text-background transition-all">+ ADD</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['member1', 'member2', 'member3', 'member4'].map((m, i) => (
              <input key={m} type="text" value={(newMembers as any)[m]} onChange={e => setNewMembers(prev => ({ ...prev, [m]: e.target.value }))} placeholder={`MEMBER ${i + 1}`} className="bg-background border border-border text-foreground text-[10px] p-1.5 tracking-[2px] text-center outline-none focus:border-foreground" />
            ))}
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {state.teams.map(t => (
            <div key={t.teamName} className={`border p-3 ${t.teamName === state.currentTeam ? 'border-foreground' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-[10px] tracking-[2px] text-foreground">{t.teamName}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentTeam(t.teamName)} className="text-[8px] tracking-[1px] text-accent hover:text-foreground px-2 py-1 border border-border">{t.teamName === state.currentTeam ? '● ACTIVE' : 'SET ACTIVE'}</button>
                  <button onClick={() => { setEditingMembers(editingMembers === t.teamName ? null : t.teamName); setEditMembers(t.members); }} className="text-[8px] tracking-[1px] text-secondary-foreground hover:text-foreground px-2 py-1 border border-border">MEMBERS</button>
                  <button onClick={() => removeTeam(t.teamName)} className="text-destructive text-[10px] hover:text-destructive/80 px-2 py-1 border border-border">×</button>
                </div>
              </div>
              {editingMembers === t.teamName && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['member1', 'member2', 'member3', 'member4'].map((m, i) => (
                    <input key={m} type="text" value={(editMembers as any)[m]} onChange={e => setEditMembers(prev => ({ ...prev, [m]: e.target.value }))} placeholder={`MEMBER ${i + 1}`} className="bg-background border border-border text-foreground text-[10px] p-1.5 tracking-[2px] text-center outline-none focus:border-foreground" onBlur={() => updateTeamMembers(t.teamName, editMembers)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {state.teams.length > 0 && (
          <button onClick={resetTeamScores} className="text-[10px] tracking-[2px] text-destructive border border-destructive/30 px-4 py-2 hover:bg-destructive hover:text-destructive-foreground transition-all">RESET ALL SCORES</button>
        )}
      </section>

      {/* Room Configuration */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">ROOM CONFIGURATION</div>
        <div className="space-y-4">
          {state.rooms.map(room => (
            <div key={room.id} className="border border-border p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="col-span-2 md:col-span-5"><div className="font-display text-sm tracking-[4px] text-foreground glow-green">{room.name}</div></div>
              <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">PASSWORD</label><input type="text" value={room.password} onChange={e => updateRoom(room.id, { password: e.target.value.toUpperCase() })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground uppercase" /></div>
              <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">POINTS</label><input type="number" value={room.points} onChange={e => updateRoom(room.id, { points: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
              <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">MINUTES</label><input type="number" value={room.timeMinutes} onChange={e => updateRoom(room.id, { timeMinutes: parseInt(e.target.value) || 1 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
              <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">SECONDS</label><input type="number" value={room.timeSeconds} onChange={e => updateRoom(room.id, { timeSeconds: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
              <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">VOLUNTEER</label><input type="text" value={room.volunteerName} onChange={e => updateRoom(room.id, { volunteerName: e.target.value })} placeholder="NAME" className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground" /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence Room */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">INTELLIGENCE ROOM</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">GATE CODE</label><input type="text" value={state.intelligence.gateCode} onChange={e => updateIntelligence({ gateCode: e.target.value.toUpperCase() })} maxLength={4} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[4px] text-center outline-none focus:border-foreground uppercase" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">CORRECT PHONE #</label><input type="text" value={state.intelligence.correctNumber} onChange={e => updateIntelligence({ correctNumber: e.target.value })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">ROOM PASSWORD</label><input type="text" value={state.intelligence.roomPassword} onChange={e => updateIntelligence({ roomPassword: e.target.value.toUpperCase() })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground uppercase" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">POINTS</label><input type="number" value={state.intelligence.points} onChange={e => updateIntelligence({ points: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">TIMER MIN</label><input type="number" value={state.intelligence.timeMinutes} onChange={e => updateIntelligence({ timeMinutes: parseInt(e.target.value) || 1 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">TIMER SEC</label><input type="number" value={state.intelligence.timeSeconds} onChange={e => updateIntelligence({ timeSeconds: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
        </div>
      </section>

      {/* Boss Room */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">BOSS ROOM — VITAL TARGETS</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">❤️ HR (BPM)</label><input type="number" value={state.boss.vitalHr} onChange={e => updateBoss({ vitalHr: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">🫀 BP (mmHg)</label><input type="number" value={state.boss.vitalBp} onChange={e => updateBoss({ vitalBp: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">🫁 O2 (SpO2%)</label><input type="number" value={state.boss.vitalO2} onChange={e => updateBoss({ vitalO2: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">🧠 NR (Hz)</label><input type="number" value={state.boss.vitalNr} onChange={e => updateBoss({ vitalNr: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">PASSWORD</label><input type="text" value={state.boss.password} onChange={e => updateBoss({ password: e.target.value.toUpperCase() })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground uppercase" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">POINTS</label><input type="number" value={state.boss.points} onChange={e => updateBoss({ points: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">TIMER MIN</label><input type="number" value={state.boss.timeMinutes} onChange={e => updateBoss({ timeMinutes: parseInt(e.target.value) || 1 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
          <div><label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">TIMER SEC</label><input type="number" value={state.boss.timeSeconds} onChange={e => updateBoss({ timeSeconds: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden" /></div>
        </div>
      </section>

      {/* Admin Password */}
      <section className="border border-border bg-card p-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">CHANGE ADMIN PASSWORD</div>
        <div className="flex gap-3">
          <input type="text" value={newAdminPw} onChange={e => setNewAdminPw(e.target.value)} placeholder="NEW PASSWORD" className="flex-1 bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[3px] text-center outline-none focus:border-foreground" />
          <button onClick={() => { if (newAdminPw.trim()) { setAdminPassword(newAdminPw.trim()); setNewAdminPw(''); } }} className="px-4 py-2 border border-warning text-warning font-display text-[10px] tracking-[2px] hover:bg-warning hover:text-background transition-all">UPDATE</button>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
