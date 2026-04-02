import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { playSuccess } from '@/lib/sounds';

const VolunteerPage = () => {
  const { state, adjustPoints } = useGame();
  const [authed, setAuthed] = useState(false);
  const [volName, setVolName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [pointsInput, setPointsInput] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  // Find rooms assigned to this volunteer
  const assignedRooms = state.rooms.filter(r => r.volunteerName.toLowerCase() === volName.toLowerCase());

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 gap-6 px-6">
        <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground">VOLUNTEER ACCESS</div>
        <div className="border border-border bg-card p-8 w-full max-w-md flex flex-col gap-4 panel-glow">
          <label className="text-[9px] tracking-[3px] text-secondary-foreground">YOUR NAME</label>
          <input
            type="text"
            value={volName}
            onChange={e => setVolName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && volName.trim()) setAuthed(true); }}
            placeholder="ENTER YOUR NAME"
            className="w-full bg-background border border-muted-foreground text-foreground font-display text-xl p-3 tracking-[4px] text-center outline-none focus:border-foreground focus:shadow-[0_0_15px_hsla(152,100%,50%,0.15)] uppercase"
          />
          <button
            onClick={() => { if (volName.trim()) setAuthed(true); }}
            className="w-full py-3 border border-foreground text-foreground font-display text-[12px] tracking-[4px] hover:bg-foreground hover:text-background transition-all"
          >
            ENTER
          </button>
        </div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground">← BACK TO HUB</Link>
      </div>
    );
  }

  const handleAdjust = () => {
    const pts = parseInt(pointsInput);
    if (!selectedTeam || isNaN(pts) || pts === 0 || !reason.trim()) {
      setFeedback('// FILL ALL FIELDS');
      setTimeout(() => setFeedback(''), 2000);
      return;
    }
    adjustPoints(selectedTeam, volName.toUpperCase(), pts, reason.trim());
    playSuccess();
    setFeedback(`${pts > 0 ? '+' : ''}${pts} POINTS → ${selectedTeam}`);
    setPointsInput('');
    setReason('');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground">
          VOLUNTEER: <span className="text-foreground">{volName.toUpperCase()}</span>
        </div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground border border-border px-4 py-2">← HUB</Link>
      </div>

      {/* Assigned Rooms */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">ASSIGNED ROOMS</div>
        {assignedRooms.length === 0 ? (
          <div className="text-[10px] text-muted-foreground tracking-[2px]">NO ROOMS ASSIGNED TO YOU</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {assignedRooms.map(r => (
              <div key={r.id} className="border border-foreground/30 bg-foreground/5 px-4 py-3">
                <div className="font-display text-sm tracking-[3px] text-foreground">{r.name}</div>
                <div className="text-[9px] text-muted-foreground tracking-[1px] mt-1">{r.points} PTS — {r.timeMinutes}:{String(r.timeSeconds).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Current Team */}
      {state.currentTeam && (
        <section className="border border-border bg-card p-6 mb-6 panel-glow">
          <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-2">ACTIVE TEAM</div>
          <div className="font-display text-lg tracking-[4px] text-foreground glow-green">{state.currentTeam}</div>
          {(() => {
            const team = state.teams.find(t => t.teamName === state.currentTeam);
            if (!team) return null;
            const members = [team.members.member1, team.members.member2, team.members.member3, team.members.member4].filter(Boolean);
            return members.length > 0 ? (
              <div className="text-[10px] text-secondary-foreground tracking-[2px] mt-1">
                MEMBERS: {members.join(', ')}
              </div>
            ) : null;
          })()}
        </section>
      )}

      {/* Point Adjustment */}
      <section className="border border-border bg-card p-6 mb-6 panel-glow">
        <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">ADJUST TEAM POINTS</div>
        <div className="text-[10px] text-muted-foreground tracking-[1px] mb-4 leading-[1.8]">
          Use positive numbers to add points, negative to deduct (e.g., -10 for rule breaking, +5 for bonus).
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">SELECT TEAM</label>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] outline-none focus:border-foreground"
            >
              <option value="">— SELECT —</option>
              {state.teams.map(t => (
                <option key={t.teamName} value={t.teamName}>{t.teamName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">POINTS (+/-)</label>
            <input
              type="number"
              value={pointsInput}
              onChange={e => setPointsInput(e.target.value)}
              placeholder="e.g. -10 or +5"
              className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] text-center outline-none focus:border-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:hidden"
            />
          </div>
          <div>
            <label className="text-[8px] tracking-[2px] text-muted-foreground block mb-1">REASON</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. LATE ARRIVAL, RULE VIOLATION"
              className="w-full bg-background border border-muted-foreground text-foreground font-display text-sm p-2 tracking-[2px] outline-none focus:border-foreground uppercase"
            />
          </div>
          <button
            onClick={handleAdjust}
            className="w-full py-3 border border-warning text-warning font-display text-[11px] tracking-[3px] hover:bg-warning hover:text-background transition-all"
          >
            SUBMIT ADJUSTMENT
          </button>
          {feedback && (
            <div className={`text-[10px] tracking-[2px] text-center ${feedback.startsWith('//') ? 'text-destructive' : 'text-foreground glow-green'}`}>
              {feedback}
            </div>
          )}
        </div>
      </section>

      {/* Recent Adjustments */}
      {state.adjustments.length > 0 && (
        <section className="border border-border bg-card p-6 panel-glow">
          <div className="font-display text-[11px] tracking-[4px] text-secondary-foreground mb-4">RECENT ADJUSTMENTS</div>
          <div className="space-y-2">
            {state.adjustments.slice(0, 10).map(adj => {
              const team = state.teams.find(t => t.id === adj.teamId);
              return (
                <div key={adj.id} className="flex justify-between items-center border border-border px-3 py-2 text-[10px]">
                  <span className="text-secondary-foreground tracking-[1px]">{team?.teamName || '?'}</span>
                  <span className={`font-display tracking-[2px] ${adj.points > 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {adj.points > 0 ? '+' : ''}{adj.points}
                  </span>
                  <span className="text-muted-foreground tracking-[1px]">{adj.reason}</span>
                  <span className="text-muted-foreground tracking-[1px]">{adj.adjustedBy}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default VolunteerPage;
