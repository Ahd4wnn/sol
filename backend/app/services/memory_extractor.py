import json
from app.services.openai_client import client
from app.services.supabase_client import supabase

async def extract_memory(user_id: str, session_id: str, user_message: str, assistant_reply: str):
    system_prompt = """You are a memory extractor for a therapy AI. Given a therapy exchange, extract 0–2 important facts about the user worth remembering long-term. These could be: names of important people in their life, key relationships, recurring struggles, important life events, stated fears, goals, or beliefs. Return ONLY a JSON array of strings. If nothing important, return []. Example: ["User's mother is named Priya and their relationship is complicated", "User failed an exam last semester and still feels shame about it"]"""
    
    user_prompt = f"User said: {user_message}\nSol replied: {assistant_reply}"

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
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
