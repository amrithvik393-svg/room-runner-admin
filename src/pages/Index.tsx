import { Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';

const Index = () => {
  const { state } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-6 gap-8">
      <div className="font-display font-black text-3xl md:text-5xl tracking-[8px] text-foreground glow-green text-center">
        MISSION MAYHEM
      </div>
      <div className="text-[10px] tracking-[4px] text-secondary-foreground text-center">
        ΣAGENCY — OPERATION CONTROL HUB
      </div>

      {state.currentTeam && (
        <div className="border border-border bg-card px-6 py-3 text-center">
          <div className="text-[9px] tracking-[3px] text-muted-foreground">ACTIVE TEAM</div>
          <div className="font-display font-bold text-foreground text-lg tracking-[4px] mt-1">{state.currentTeam}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
        {state.rooms.map((room, i) => (
          <Link
            key={room.id}
            to={room.id === 'intelligence' ? '/intelligence' : `/room/${room.id}`}
            className="border border-border bg-card p-6 flex flex-col gap-2 transition-all hover:border-foreground hover:shadow-[0_0_20px_hsla(152,100%,50%,0.15)] group"
          >
            <div className="text-[9px] tracking-[4px] text-muted-foreground">ROOM {String(i + 1).padStart(2, '0')}</div>
            <div className="font-display font-bold text-lg tracking-[4px] text-foreground group-hover:glow-green">
              {room.name}
            </div>
            <div className="text-[10px] tracking-[2px] text-secondary-foreground">
              {room.points} PTS — {room.timeMinutes}:{String(room.timeSeconds).padStart(2, '0')}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4 mt-4">
        <Link
          to="/scoreboard"
          className="border border-border px-6 py-3 font-display text-[11px] tracking-[3px] text-secondary-foreground hover:border-foreground hover:text-foreground transition-all"
        >
          SCOREBOARD
        </Link>
        <Link
          to="/admin"
          className="border border-muted-foreground px-6 py-3 font-display text-[11px] tracking-[3px] text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
        >
          ADMIN
        </Link>
      </div>
    </div>
  );
};

export default Index;
