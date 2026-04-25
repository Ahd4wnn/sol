-- Add memory tier fields to memory_notes
ALTER TABLE public.memory_notes
  ADD COLUMN IF NOT EXISTS tier TEXT
    CHECK (tier IN ('short', 'long', 'permanent'))
    DEFAULT 'long',
  ADD COLUMN IF NOT EXISTS relevance_score NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ
    DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 1;

-- Index for efficient tier queries
CREATE INDEX IF NOT EXISTS idx_memory_tier
  ON public.memory_notes(user_id, tier);

CREATE INDEX IF NOT EXISTS idx_memory_relevance
  ON public.memory_notes(user_id, relevance_score DESC);
