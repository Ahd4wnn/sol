import logging
from app.services.supabase_client import supabase

logger = logging.getLogger("sol")

async def build_context(user_id: str, session_id: str) -> dict:
    try:
        # 1. User profile + therapist settings
        user_res = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .limit(1).execute()
        user_profile = (user_res.data or [{}])[0]

        # 2. Personality profile from intake
        intake_res = supabase.table("intake_responses")\
            .select("personality_profile")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1).execute()
        personality_profile = {}
        if intake_res.data:
            personality_profile = intake_res.data[0].get(
                "personality_profile"
            ) or {}

        # 3. Current session messages ONLY
        # CRITICAL: desc=False = oldest first = chronological order
        # This is what the AI needs to understand the conversation
        msgs_res = supabase.table("messages")\
            .select("role, content, created_at")\
            .eq("session_id", session_id)\
            .order("created_at", desc=False)\
            .execute()

        current_messages = []
        for msg in (msgs_res.data or []):
            if msg.get("content", "").strip():  # skip empty
                current_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        logger.info(
            f"Fetched {len(current_messages)} messages for session "
            f"{session_id} in chronological order"
        )

        # 4. Current session metadata
        session_res = supabase.table("therapy_sessions")\
            .select("title, mood_before, mood_word, opening_context")\
            .eq("id", session_id)\
            .eq("user_id", user_id)\
            .limit(1).execute()
        session_data = (session_res.data or [{}])[0]

        # 5. Relationship notes only — these are factual, not conversational
        # Keep these because they are facts, not memories
        # e.g. "User's mother is named Priya"
        rel_res = supabase.table("memory_notes")\
            .select("note")\
            .eq("user_id", user_id)\
            .contains("tags", ["relationship"])\
            .order("created_at", desc=True)\
            .execute()
        relationship_notes = [
            n["note"].replace("[Relationship] ", "")
            for n in (rel_res.data or [])
        ]

        context = {
            "personality_profile": personality_profile,
            "user_profile": user_profile,
            "current_messages": current_messages,
            "relationship_notes": relationship_notes,
            # ── INTENTIONALLY REMOVED ──
            # memory_notes: removed (causes repetition)
            # past_session_summaries: removed (causes repetition)
            # These will be re-enabled in a future update
            # once memory architecture is improved
            "session_metadata": {
                "mood_before": session_data.get("mood_before", ""),
                "mood_word":   session_data.get("mood_word", ""),
                "opening_context": session_data.get("opening_context", ""),
                "title": session_data.get("title", ""),
            },
            "past_session_summaries": [],  # intentionally empty
            "memory_notes": [],            # intentionally empty
        }

        logger.info(
            f"Context built: "
            f"messages={len(current_messages)}, "
            f"relationships={len(relationship_notes)}"
        )

        return context

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
            "session_metadata": {},
            "past_session_summaries": [],
            "memory_notes": [],
        }