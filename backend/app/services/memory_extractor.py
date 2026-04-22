import json
from app.services.openai_client import client
from app.services.supabase_client import supabase

async def extract_memory(user_id: str, session_id: str, user_message: str, assistant_reply: str):
    EXTRACTION_SYSTEM_PROMPT = """
You are a memory extractor for a therapy AI.
Given a therapy exchange, extract 0-2 important FACTS
about the user worth remembering across ALL sessions.

ONLY extract:
- Names of important people (family, friends, partners)
- Key relationships and their dynamics
- Major life events or situations (job loss, breakup, illness)
- Stated phobias or triggers
- Explicitly stated diagnoses or conditions

Do NOT extract:
- How they felt in this session (that's session-specific)
- What they talked about this session
- Their current mood
- Anything that might change week to week

Return ONLY a JSON array of strings.
If nothing qualifies, return [].

Example good extractions:
["User's mother is named Priya, relationship is complicated",
 "User has been diagnosed with anxiety"]

Example bad extractions (do NOT do these):
["User felt sad today",
 "User is stressed about exams this week"]
"""
    
    user_prompt = f"User said: {user_message}\nSol replied: {assistant_reply}"

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0
        )
        
        reply = completion.choices[0].message.content.strip()
        if reply.startswith("```json"):
            reply = reply[7:-3].strip()
        elif reply.startswith("```"):
            reply = reply[3:-3].strip()
            
        facts = json.loads(reply)
        
        if not facts or not isinstance(facts, list):
            return

        # Fetch existing memory notes to avoid duplicates (naive approach)
        existing_res = supabase.table("memory_notes").select("note").eq("user_id", user_id).execute()
        existing_notes = [n["note"].lower() for n in existing_res.data] if (hasattr(existing_res, 'data') and len(existing_res.data) > 0) else []

        for fact in facts:
            fact_prefix = fact[:40].lower()
            is_dupe = any(fact_prefix in en for en in existing_notes)
            if not is_dupe:
                supabase.table("memory_notes").insert({
                    "user_id": user_id,
                    "note": fact,
                    "source_session_id": session_id
                }).execute()

    except Exception as e:
        print(f"Memory extraction error: {e}")
