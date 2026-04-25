import logging
import json
from app.services.supabase_client import supabase
from datetime import datetime

logger = logging.getLogger("sol")


async def save_structured_memory(
    user_id: str,
    session_id: str,
    structured: dict
) -> bool:
    """
    Save a structured memory fact about the user.

    Supported structures:
      {"type": "user_identity", "key": "name", "value": "Adon"}
      {"type": "relationship", "person": "Laya", "relation": "love_interest"}
      {"type": "fact", "content": "Laya is in user's class"}
      {"type": "pattern", "content": "avoids direct confrontation"}
      {"type": "goal", "content": "wants to improve self-confidence"}
    """
    try:
        mem_type = structured.get("type", "fact")

        # Check for duplicate
        existing = None

        if mem_type == "user_identity":
            key = structured.get("key", "")
            res = supabase.table("memory_notes")\
                .select("id, memory_value")\
                .eq("user_id", user_id)\
                .eq("memory_type", "user_identity")\
                .eq("memory_key", key)\
                .limit(1).execute()
            existing = (res.data or [None])[0]

        elif mem_type == "relationship":
            person = structured.get("person", "")
            res = supabase.table("memory_notes")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("memory_type", "relationship")\
                .ilike("person_name", person)\
                .limit(1).execute()
            existing = (res.data or [None])[0]

        elif mem_type in ("fact", "pattern", "goal"):
            content = structured.get("content", "")
            res = supabase.table("memory_notes")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("memory_type", mem_type)\
                .ilike("note", f"%{content[:40]}%")\
                .limit(1).execute()
            existing = (res.data or [None])[0]

        now = datetime.utcnow().isoformat()

        if existing:
            supabase.table("memory_notes").update({
                "structured": json.dumps(structured),
                "memory_value": structured.get("value") or
                                structured.get("content") or
                                structured.get("relation", ""),
                "last_accessed": now,
            }).eq("id", existing["id"]).execute()
            logger.info(f"Updated memory [{mem_type}]: {structured}")
        else:
            note_text = _format_note(structured)
            supabase.table("memory_notes").insert({
                "user_id": user_id,
                "source_session_id": session_id,
                "note": note_text,
                "memory_type": mem_type,
                "memory_key": structured.get("key"),
                "memory_value": structured.get("value") or
                                structured.get("content") or
                                structured.get("relation", ""),
                "person_name": structured.get("person"),
                "relation": structured.get("relation"),
                "structured": json.dumps(structured),
                "tags": [mem_type],
                "tier": "permanent" if mem_type == "user_identity"
                        else "long",
            }).execute()
            logger.info(f"Saved memory [{mem_type}]: {structured}")

        return True

    except Exception as e:
        logger.error(f"save_structured_memory failed: {e}",
                     exc_info=True)
        return False


def _format_note(structured: dict) -> str:
    t = structured.get("type")
    if t == "user_identity":
        return (f"[identity] {structured.get('key')}: "
                f"{structured.get('value')}")
    elif t == "relationship":
        return (f"[relationship] {structured.get('person')} "
                f"({structured.get('relation')})")
    elif t == "fact":
        return f"[fact] {structured.get('content')}"
    elif t == "pattern":
        return f"[pattern] {structured.get('content')}"
    elif t == "goal":
        return f"[goal] {structured.get('content')}"
    return str(structured)


async def get_user_memories(user_id: str) -> dict:
    """
    Fetch all structured memories for a user.
    Returns organised by type for easy injection into prompt.
    """
    try:
        res = supabase.table("memory_notes")\
            .select("memory_type, memory_key, memory_value, "
                    "person_name, relation, structured, note")\
            .eq("user_id", user_id)\
            .order("created_at", desc=False)\
            .execute()

        memories = {
            "identity": {},
            "relationships": [],
            "facts": [],
            "patterns": [],
            "goals": [],
        }

        for m in (res.data or []):
            tags = m.get("tags") or []
            if isinstance(tags, list) and "crisis_flag" in tags:
                continue

            t = m.get("memory_type")
            s = {}
            raw_s = m.get("structured")
            if isinstance(raw_s, dict):
                s = raw_s
            elif isinstance(raw_s, str):
                try:
                    s = json.loads(raw_s)
                except Exception:
                    s = {}

            if t == "user_identity":
                key = m.get("memory_key") or s.get("key")
                val = m.get("memory_value") or s.get("value")
                if key and val:
                    memories["identity"][key] = val

            elif t == "relationship":
                person = m.get("person_name") or s.get("person")
                relation = m.get("relation") or s.get("relation")
                if person:
                    memories["relationships"].append({
                        "person": person,
                        "relation": relation or "known person"
                    })

            elif t == "fact":
                content = (m.get("memory_value") or
                           s.get("content") or
                           m.get("note", ""))
                if content:
                    memories["facts"].append(
                        content.replace("[fact] ", "")
                    )

            elif t == "pattern":
                content = (m.get("memory_value") or
                           s.get("content") or
                           m.get("note", ""))
                if content:
                    memories["patterns"].append(
                        content.replace("[pattern] ", "")
                    )

            elif t == "goal":
                content = (m.get("memory_value") or
                           s.get("content") or
                           m.get("note", ""))
                if content:
                    memories["goals"].append(
                        content.replace("[goal] ", "")
                    )

        return memories

    except Exception as e:
        logger.error(f"get_user_memories failed: {e}")
        return {
            "identity": {}, "relationships": [],
            "facts": [], "patterns": [], "goals": []
        }


def format_memories_for_prompt(memories: dict) -> str:
    """Convert structured memories to clean prompt text."""
    lines = []

    if memories.get("identity"):
        for key, val in memories["identity"].items():
            lines.append(f"- User's {key}: {val}")

    if memories.get("relationships"):
        for r in memories["relationships"][:10]:
            lines.append(
                f"- {r['person']} ({r['relation']})"
            )

    if memories.get("facts"):
        for f in memories["facts"][:8]:
            lines.append(f"- {f}")

    if memories.get("patterns"):
        for p in memories["patterns"][:5]:
            lines.append(f"- Pattern: {p}")

    if memories.get("goals"):
        for g in memories["goals"][:3]:
            lines.append(f"- Goal: {g}")

    return "\n".join(lines) if lines else "None yet."
