import logging
from app.services.supabase_client import supabase

logger = logging.getLogger("sol")

async def build_context(user_id: str, session_id: str) -> dict:
    try:
        # 1. Personality profile
        profile_res = supabase.table("intake_responses")\
            .select("personality_profile")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1).execute()
        personality_profile = {}
        if profile_res.data:
            personality_profile = profile_res.data[0].get("personality_profile") or {}

        # 2. User profile
        user_res = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .limit(1).execute()
        user_profile = {}
        if user_res.data:
            user_profile = user_res.data[0] or {}

        # 3. Current session messages (last 20, reversed to chronological)
        msgs_res = supabase.table("messages")\
            .select("role, content")\
            .eq("session_id", session_id)\
            .order("created_at", desc=True)\
            .limit(20).execute()
        raw_messages = msgs_res.data or []
        current_messages = list(reversed(raw_messages))

        # 4. Memory notes — separate general notes from relationship notes
        memory_res = supabase.table("memory_notes")\
            .select("note, tags")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True).execute()
        all_notes = memory_res.data or []
        
        memory_notes = []
        relationship_notes = []
        for n in all_notes:
            note_text = n.get("note", "")
            tags = n.get("tags") or []
            # tags may be a list or None
            if not isinstance(tags, list):
                tags = []
            if "crisis_flag" in tags:
                continue  # never expose crisis flags
            if "relationship" in tags:
                relationship_notes.append(note_text)
            else:
                memory_notes.append(note_text)

        # 5. Session metadata
        session_res = supabase.table("therapy_sessions")\
            .select("*")\
            .eq("id", session_id)\
            .eq("user_id", user_id)\
            .limit(1).execute()
        session_data = {}
        if session_res.data:
            session_data = session_res.data[0] or {}

        # 6. Past session summaries (last 3, excluding current)
        past_res = supabase.table("therapy_sessions")\
            .select("summary, title, created_at")\
            .eq("user_id", user_id)\
            .neq("id", session_id)\
            .order("created_at", desc=True)\
            .limit(3).execute()
        past_data = past_res.data or []
        past_session_summaries = [
            s["summary"] for s in past_data
            if s.get("summary")
        ]

        context = {
            "personality_profile": personality_profile,
            "user_profile": user_profile,
            "current_messages": current_messages,
            "memory_notes": memory_notes,
            "relationship_notes": relationship_notes,
            "session_metadata": {
                "mood_before": session_data.get("mood_before", ""),
                "mood_word": session_data.get("mood_word", ""),
                "opening_context": session_data.get("opening_context", ""),
                "title": session_data.get("title", ""),
            },
            "past_session_summaries": past_session_summaries,
        }

        logger.info(f"Context built: profile={bool(personality_profile)}, "
                    f"messages={len(current_messages)}, "
                    f"notes={len(memory_notes)}, "
                    f"relationships={len(relationship_notes)}, "
                    f"past_sessions={len(past_session_summaries)}")

        return context

    except Exception as e:
        logger.error(f"build_context crashed for user {user_id}: {e}", exc_info=True)
        # Return safe empty context so the stream can still proceed
        return {
            "personality_profile": {},
            "user_profile": {},
            "current_messages": [],
            "memory_notes": [],
            "relationship_notes": [],
            "session_metadata": {},
            "past_session_summaries": [],
        }