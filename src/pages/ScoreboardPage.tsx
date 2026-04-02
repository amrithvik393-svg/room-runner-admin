import { Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';

const ScoreboardPage = () => {
  const { state } = useGame();
  const sortedTeams = [...state.teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="font-display text-[13px] tracking-[5px] text-secondary-foreground">MISSION SCOREBOARD</div>
        <Link to="/" className="text-muted-foreground text-[10px] tracking-[2px] hover:text-foreground border border-border px-4 py-2">← HUB</Link>
      </div>

      {sortedTeams.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <div className="font-display text-[12px] tracking-[4px] text-muted-foreground">NO TEAMS REGISTERED</div>
          <div className="text-[10px] tracking-[2px] text-muted-foreground mt-2">Add teams from the Admin panel</div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTeams.map((team, i) => (
            <div key={team.teamName} className={`border bg-card p-6 ${i === 0 ? 'border-foreground shadow-[0_0_20px_hsla(152,100%,50%,0.15)]' : 'border-border'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className={`font-display text-2xl font-black ${i === 0 ? 'text-foreground glow-green' : 'text-muted-foreground'}`}>
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-display text-lg tracking-[4px] text-foreground">{team.teamName}</div>
                    <div className="text-[9px] tracking-[2px] text-muted-foreground">
                      {Object.values(team.rooms).filter(r => r.completed).length} / {state.rooms.length} ROOMS CLEARED
                    </div>
                  </div>
                </div>
                <div className="font-display text-3xl font-black text-foreground glow-green tracking-[2px]">
                  {team.totalPoints}
                  <span className="text-[10px] tracking-[2px] text-secondary-foreground block text-right">PTS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {state.rooms.map(room => {
                  const roomScore = team.rooms[room.id];
                  return (
                    <div key={room.id} className={`border p-2 text-center ${roomScore?.completed ? 'border-foreground/30 bg-foreground/5' : 'border-border'}`}>
                      <div className="text-[8px] tracking-[2px] text-muted-foreground">{room.name}</div>
                      {roomScore?.completed ? (
                        <>
                          <div className="font-display text-sm text-foreground">{roomScore.points} PTS</div>
                          <div className="text-[8px] text-secondary-foreground">
                            {String(Math.floor(roomScore.timeElapsed / 60)).padStart(2, '0')}:{String(roomScore.timeElapsed % 60).padStart(2, '0')}
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-muted-foreground mt-1">—</div>
                      )}
                    </div>
                  );
                })}
                {/* Intelligence task */}
                {(() => {
                  const intelScore = team.rooms['intelligence-task'];
                  return (
                    <div className={`border p-2 text-center ${intelScore?.completed ? 'border-foreground/30 bg-foreground/5' : 'border-border'}`}>
                      <div className="text-[8px] tracking-[2px] text-muted-foreground">INTEL TASK</div>
                      {intelScore?.completed ? (
                        <div className="font-display text-sm text-foreground">{intelScore.points} PTS</div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground mt-1">—</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreboardPage;
