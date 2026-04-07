ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_early_member BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS early_member_number INTEGER,
  ADD COLUMN IF NOT EXISTS early_member_code_used TEXT,
  ADD COLUMN IF NOT EXISTS early_member_granted_at TIMESTAMPTZ;

CREATE TABLE public.early_member_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- e.g. "SOL-EARLY-X7K2"
  member_number INTEGER NOT NULL,      -- 1 through 100
  redeemed_by UUID REFERENCES public.profiles(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.early_member_codes ENABLE ROW LEVEL SECURITY;
-- Users can read codes to check validity (but not see who redeemed others)
CREATE POLICY "Users can check code validity"
  ON public.early_member_codes FOR SELECT
  USING (redeemed_by IS NULL OR redeemed_by = auth.uid());
