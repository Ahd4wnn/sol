import json
import logging
from app.services.openai_client import client
from app.services.supabase_client import supabase
from datetime import datetime

logger = logging.getLogger("sol")

EXTRACTION_PROMPT = """
You are a memory classifier for a therapy AI.

Analyze this exchange and extract memories in two categories:

LONG TERM (behaviour patterns, recurring themes, self-beliefs):
- Things likely to still be true in future sessions
- Patterns in how the person thinks, feels, or behaves
- Significant life facts (job, relationships, diagnosis)
- Emotional patterns: "tends to minimise their feelings"

PERMANENT (facts highly likely to always be true):
- Names of important people
- Long-term relationships
- Diagnosed conditions
- Major permanent life circumstances

Return ONLY valid JSON:
{
  "long_term": ["memory1", "memory2"],
  "permanent": ["memory1", "memory2"]
}

Rules:
- Maximum 2 items per category
- Empty array [] if nothing qualifies
- Current mood or session-specific feelings = NOT stored
- Nothing that will change week to week
- Be specific: "avoids direct confrontation" not "has issues"
"""

async def extract_memory(
    user_id: str,
    session_id: str,
    user_message: str,
    assistant_reply: str
):
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content":
                    f"User said: {user_message}\n"
                    f"Sol replied: {assistant_reply}"
                }
            ],
            max_tokens=300,
            temperature=0.3,
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        extracted = json.loads(raw)

        long_term = extracted.get("long_term") or []
        permanent = extracted.get("permanent") or []

        # Process long term memories
        for note_text in long_term:
            if not note_text.strip():
                continue
            await upsert_memory(
                user_id, session_id,
                note_text, "long",
                ["long_term"]
            )

        # Process permanent memories
        for note_text in permanent:
            if not note_text.strip():
                continue
            # Determine tags — add "relationship" if it mentions people
            is_relationship = any(
                w in note_text.lower()
                for w in ["name", "mother", "father",
                          "friend", "partner", "sister",
                          "brother", "girlfriend", "boyfriend",
                          "wife", "husband", "family"]
            )
            tags = ["permanent", "relationship"] if is_relationship else ["permanent"]
            await upsert_memory(
                user_id, session_id,
                note_text, "permanent",
                tags
            )

    except json.JSONDecodeError:
        logger.warning(f"Memory extraction returned invalid JSON")
    except Exception as e:
        logger.error(f"extract_memory failed: {e}", exc_info=True)


async def upsert_memory(
    user_id: str,
    session_id: str,
    note_text: str,
    tier: str,
    tags: list
):
    """
    Insert new memory or increment session_count if similar
    memory already exists (promotes to permanent after 3 sessions).
    """
    try:
        # Check if very similar memory exists
        # (simple: check first 40 chars)
        key = note_text[:40].lower()

        existing = supabase.table("memory_notes")\
            .select("id, session_count, tier")\
            .eq("user_id", user_id)\
            .ilike("note", f"%{key}%")\
            .limit(1).execute()

        if existing.data:
            # Update existing memory
            existing_note = existing.data[0]
            new_count = (existing_note.get("session_count") or 1) + 1
            new_tier = tier

            # Promote to permanent if seen 3+ times
            if new_count >= 3 and existing_note["tier"] != "permanent":
                new_tier = "permanent"
                tags = list(set(tags + ["permanent"]))
                logger.info(
                    f"Memory promoted to permanent: {note_text[:50]}"
                )

            supabase.table("memory_notes").update({
                "session_count": new_count,
                "tier": new_tier,
                "tags": tags,
                "last_accessed": datetime.utcnow().isoformat(),
                "access_count": (
                    existing_note.get("access_count") or 0
                ) + 1,
            }).eq("id", existing_note["id"]).execute()

        else:
            # Insert new memory
            supabase.table("memory_notes").insert({
                "user_id": user_id,
                "note": note_text,
                "tags": tags,
                "tier": tier,
                "source_session_id": session_id,
                "relevance_score": 1.0,
                "session_count": 1,
                "access_count": 1,
                "last_accessed": datetime.utcnow().isoformat(),
            }).execute()

            logger.info(
                f"New {tier} memory: {note_text[:60]}"
            )

    except Exception as e:
        logger.error(f"upsert_memory failed: {e}", exc_info=True)


async def apply_memory_decay():
    """
    Called periodically (daily) to decay long_term memories.
    Decay rate: 8% per day for long term.
    Permanent memories never decay.
    """
    try:
        # Get all long_term memories
        res = supabase.table("memory_notes")\
            .select("id, relevance_score, tier")\
            .eq("tier", "long")\
            .execute()

        for note in (res.data or []):
            current_score = note.get("relevance_score") or 1.0
            # Apply 8% decay, floor at 0.1
            new_score = max(0.1, current_score * 0.92)
            supabase.table("memory_notes").update({
                "relevance_score": round(new_score, 3)
            }).eq("id", note["id"]).execute()

        logger.info(
            f"Memory decay applied to "
            f"{len(res.data or [])} long-term memories"
        )
    except Exception as e:
        logger.error(f"apply_memory_decay failed: {e}")
