
-- Create volunteers table
CREATE TABLE public.volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Allow all access (public game, no auth)
CREATE POLICY "Allow all access" ON public.volunteers FOR ALL USING (true) WITH CHECK (true);

-- Add active_team_id to rooms table for per-room active team
ALTER TABLE public.rooms ADD COLUMN active_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable realtime for volunteers
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;
