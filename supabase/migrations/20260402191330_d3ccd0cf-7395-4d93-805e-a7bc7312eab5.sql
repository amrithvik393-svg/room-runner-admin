
CREATE TABLE public.game_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  admin_password TEXT NOT NULL DEFAULT 'admin',
  current_team TEXT DEFAULT '',
  intelligence_gate_code TEXT DEFAULT 'MONK',
  intelligence_correct_number TEXT DEFAULT '9884512345',
  intelligence_room_password TEXT DEFAULT 'ENIGMA',
  intelligence_points INTEGER DEFAULT 100,
  intelligence_time_minutes INTEGER DEFAULT 6,
  intelligence_time_seconds INTEGER DEFAULT 0,
  boss_room_password TEXT DEFAULT 'GENESIS',
  boss_vital_hr INTEGER DEFAULT 57,
  boss_vital_bp INTEGER DEFAULT 145,
  boss_vital_o2 INTEGER DEFAULT 91,
  boss_vital_nr INTEGER DEFAULT 44,
  boss_points INTEGER DEFAULT 200,
  boss_time_minutes INTEGER DEFAULT 10,
  boss_time_seconds INTEGER DEFAULT 0,
  intelligence_categories JSONB DEFAULT '[
    {"letter":"M","name":"MAMMALS","items":["Elephant","Whale","Lion","Bat"]},
    {"letter":"O","name":"OCEANS","items":["Pacific","Atlantic","Indian","Arctic"]},
    {"letter":"N","name":"NUMBERS","items":["Pi","Infinity","Phi","Euler"]},
    {"letter":"K","name":"KNIVES","items":["Bowie","Swiss","Stiletto","Cleaver"]}
  ]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT DEFAULT '',
  points INTEGER DEFAULT 100,
  time_minutes INTEGER DEFAULT 6,
  time_seconds INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  volunteer_name TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL UNIQUE,
  member1 TEXT DEFAULT '',
  member2 TEXT DEFAULT '',
  member3 TEXT DEFAULT '',
  member4 TEXT DEFAULT '',
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.team_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT true,
  time_elapsed INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, room_id)
);

CREATE TABLE public.point_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  adjusted_by TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.game_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.team_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.point_adjustments FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.game_config (id) VALUES ('main');

INSERT INTO public.rooms (id, name, password, points, time_minutes, time_seconds, sort_order) VALUES
  ('strength', 'STRENGTH', 'DEIFIED', 100, 6, 0, 1),
  ('strategy', 'STRATEGY', '', 100, 6, 0, 2),
  ('memory', 'MEMORY', '', 100, 6, 0, 3),
  ('intelligence', 'INTELLIGENCE', '', 100, 6, 0, 4),
  ('stealth', 'STEALTH', '', 100, 6, 0, 5);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.point_adjustments;
