from app.services.openai_client import client
from app.services.supabase_client import supabase

async def summarize_session(session_id: str, user_id: str):
    # Fetch all messages from the session
    msgs_res = supabase.table("messages").select("role, content").eq("session_id", session_id).order("created_at", desc=False).execute()
    messages = msgs_res.data if hasattr(msgs_res, 'data') else []
    
    if len(messages) < 4:
        return # Skip summarization if fewer than 4 messages
        
    transcript = "\n".join([f"{'User' if m['role'] == 'user' else 'Sol'}: {m['content']}" for m in messages])
    
    system_prompt = "You are summarizing a therapy session for an AI therapist's memory. Write a 3–5 sentence summary covering: the main topic discussed, the emotional state of the user, any breakthroughs or insights, and anything Sol should remember for next time. Write in third person. Be specific, not generic."

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=0.7
        )
        
        summary = completion.choices[0].message.content.strip()
        
        supabase.table("therapy_sessions").update({"summary": summary}).eq("id", session_id).execute()
    except Exception as e:
        print(f"Summarizer error: {e}")
