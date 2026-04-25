-- Structured memory columns for memory_notes
ALTER TABLE public.memory_notes
  ADD COLUMN IF NOT EXISTS memory_type TEXT,
  ADD COLUMN IF NOT EXISTS memory_key TEXT,
  ADD COLUMN IF NOT EXISTS memory_value TEXT,
  ADD COLUMN IF NOT EXISTS person_name TEXT,
  ADD COLUMN IF NOT EXISTS relation TEXT,
  ADD COLUMN IF NOT EXISTS structured JSONB;

-- Index for fast lookups by type
CREATE INDEX IF NOT EXISTS idx_memory_type
  ON public.memory_notes(user_id, memory_type);

CREATE INDEX IF NOT EXISTS idx_memory_person
  ON public.memory_notes(user_id, person_name);

-- Soft delete support for therapy_sessions
ALTER TABLE public.therapy_sessions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
