import logging
from app.services.supabase_client import supabase

logger = logging.getLogger("sol")

async def build_context(user_id: str, session_id: str) -> dict:
    """
    Fetches ONLY profile and session metadata.
    Message history is handled directly in the router
    to avoid race conditions and ordering issues.
    """
    try:
        # User profile + therapist settings
        user_res = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .limit(1).execute()
        user_profile = (user_res.data or [{}])[0]

        # Personality profile
        intake_res = supabase.table("intake_responses")\
            .select("personality_profile")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1).execute()
        personality_profile = {}
        if intake_res.data:
            personality_profile = (
                intake_res.data[0].get("personality_profile") or {}
            )

        # Session metadata
        session_res = supabase.table("therapy_sessions")\
            .select("title, mood_before, mood_word, opening_context")\
            .eq("id", session_id)\
            .eq("user_id", user_id)\
            .limit(1).execute()
        session_data = (session_res.data or [{}])[0]

        # Relationship notes (factual, not conversational)
        rel_res = supabase.table("memory_notes")\
            .select("note, tags")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        relationship_notes = []
        long_term_memory = []
        permanent_memory = []

        for n in (rel_res.data or []):
            tags = n.get("tags") or []
            if not isinstance(tags, list):
                tags = []
            if "crisis_flag" in tags:
                continue
            note_text = n.get("note", "").strip()
            if not note_text:
                continue

            if "permanent" in tags:
                permanent_memory.append(note_text)
            elif "relationship" in tags:
                relationship_notes.append(note_text)
            elif "long_term" in tags or "journal" in tags:
                long_term_memory.append(note_text)

        logger.info(
            f"Context: profile={bool(personality_profile)}, "
            f"relationships={len(relationship_notes)}, "
            f"long_term={len(long_term_memory)}, "
            f"permanent={len(permanent_memory)}"
        )

        return {
            "personality_profile": personality_profile,
            "user_profile": user_profile,
            "current_messages": [],  # intentionally empty
                                     # handled in router
            "relationship_notes": relationship_notes,
            "long_term_memory": long_term_memory,
            "permanent_memory": permanent_memory,
            "session_metadata": {
                "mood_before": session_data.get("mood_before", ""),
                "mood_word": session_data.get("mood_word", ""),
                "opening_context": session_data.get(
                    "opening_context", ""
                ),
                "title": session_data.get("title", ""),
            },
        }

    except Exception as e:
        logger.error(
            f"build_context crashed for user {user_id}: {e}",
            exc_info=True
        )
        return {
            "personality_profile": {},
            "user_profile": {},
            "current_messages": [],
            "relationship_notes": [],
            "long_term_memory": [],
            "permanent_memory": [],
            "session_metadata": {},
        }