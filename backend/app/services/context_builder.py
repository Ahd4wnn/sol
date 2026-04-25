import logging
from app.services.supabase_client import supabase
from app.services.memory_service import (
    get_user_memories,
    format_memories_for_prompt
)

logger = logging.getLogger("sol")

async def build_context(user_id: str, session_id: str) -> dict:
    """
    Fetches profile, session metadata, and structured memories.
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

        # Structured memories
        memories = await get_user_memories(user_id)
        formatted_memories = format_memories_for_prompt(memories)

        logger.info(
            f"Context: profile={bool(personality_profile)}, "
            f"memories={formatted_memories[:80] if formatted_memories else 'none'}"
        )

        return {
            "personality_profile": personality_profile,
            "user_profile": user_profile,
            "current_messages": [],  # handled in router
            "formatted_memories": formatted_memories,
            "raw_memories": memories,
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
            "formatted_memories": "",
            "raw_memories": {},
            "session_metadata": {},
        }