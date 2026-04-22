import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.middleware.auth import get_current_user
from app.services.supabase_client import supabase
from app.models.schemas import SendMessageRequest
from app.services.context_builder import build_context
from app.services.ai_engine import build_system_prompt
from app.services.memory_extractor import extract_memory
from app.services.openai_client import client
from app.services.sol_agent import stream_sol_response
import logging
import re
from datetime import datetime
from app.services.subscription_service import check_can_send_message, increment_message_count

logger = logging.getLogger("sol")

SEVERE_CRISIS_KEYWORDS = [
    "going to commit suicide",
    "going to kill myself",
    "going to end my life",
    "about to kill myself",
    "about to commit suicide",
    "want to commit suicide",
    "planning to kill myself",
    "decided to kill myself",
    "will kill myself",
    "i will die tonight",
    "ending my life tonight",
    "ending it tonight",
    "this is my last",
    "goodbye forever",
    "won't be alive",
    "i am going to commit suicide",
]

MODERATE_CRISIS_KEYWORDS = [
    "want to die", "i want to die",
    "don't want to live", "no reason to live",
    "better off dead", "better off without me",
    "everyone would be better without me",
    "i am done with my life",
    "done with life", "done with everything",
    "can't go on", "can't do this anymore",
    "hurt myself", "cutting myself",
    "self harm", "self-harm",
    "suicide", "suicidal",
    "don't want to be here",
    "want to disappear forever", "ending it",
    "overdose", "won't be here",
    "last message",
]

def detect_crisis_level(text: str) -> str:
    """Returns 'severe', 'moderate', or 'none'"""
    text_lower = text.lower()
    if any(kw in text_lower for kw in SEVERE_CRISIS_KEYWORDS):
        return "severe"
    if any(kw in text_lower for kw in MODERATE_CRISIS_KEYWORDS):
        return "moderate"
    return "none"

SEVERE_CRISIS_RESPONSE = """I hear you. And I'm so glad you're still here, talking to me right now.

What you just said is the most important thing you could have told me. Please don't go anywhere.

**Right now, please reach out to someone who can be with you:**

🇮🇳 **iCall** — Free, confidential, real humans
📞 **9152987821**
Mon–Sat, 8am–10pm IST
🌐 icallhelpline.org

🇮🇳 **Vandrevala Foundation** — Available right now, 24/7
📞 **1860-2662-345**
🌐 vandrevalafoundation.com

🇮🇳 **NIMHANS Helpline** — Government mental health support
📞 **080-46110007**
🌐 nimhans.ac.in

If you are in immediate danger, please go to your nearest hospital emergency room or call someone you trust to be with you right now.

I'm still here with you. Can you tell me — are you safe right now?"""


def extract_and_strip_feedback(content: str) -> tuple[str, dict | None]:
    pattern = r'\[FEEDBACK::([^:]+)::([^:]+)::([^\]]+)\]'
    match = re.search(pattern, content)
    if not match:
        return content, None
    category, sentiment, quote = match.groups()
    cleaned = re.sub(pattern, '', content).strip()
    return cleaned, {
        "category": category.strip(),
        "sentiment": sentiment.strip(),
        "quote": quote.strip()
    }
router = APIRouter(prefix="/messages", tags=["messages"])


async def verify_session(session_id: str, user_id: str):
    res = supabase.table("therapy_sessions").select("id")\
        .eq("id", session_id).eq("user_id", user_id).limit(1).execute()
    if not hasattr(res, 'data') or len(res.data) == 0:
        raise HTTPException(status_code=403, detail={"error": True, "message": "Session access denied"})


@router.post("/send")
async def send_message(payload: SendMessageRequest, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    await verify_session(payload.session_id, user.id)

    limit_check = await check_can_send_message(user.id)
    if not limit_check["allowed"]:
        raise HTTPException(
            status_code=402,
            detail={
                "error": True,
                "code": "TRIAL_EXCEEDED",
                "message": "You've used all 20 free messages.",
                "messages_used": limit_check["messages_used"],
                "limit": limit_check["limit"]
            }
        )

    try:
        supabase.table("messages").insert({
            "session_id": payload.session_id, "role": "user", "content": payload.content
        }).execute()

        crisis_level = detect_crisis_level(payload.content)

        if crisis_level == "severe":
            logger.warning(f"SEVERE CRISIS: user={user.id} message={payload.content[:80]}")
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[SEVERE CRISIS FLAG] {payload.content[:300]}",
                    "tags": ["crisis_flag", "severe"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as ce:
                logger.error(f"Crisis logging failed: {ce}")

            res = supabase.table("messages").insert({
                "session_id": payload.session_id,
                "role": "assistant",
                "content": SEVERE_CRISIS_RESPONSE,
            }).execute()
            final_msg = res.data[0] if (hasattr(res, 'data') and res.data) else {"content": SEVERE_CRISIS_RESPONSE}
            await increment_message_count(user.id)
            return final_msg

        if crisis_level == "moderate":
            logger.warning(f"MODERATE CRISIS: user={user.id} message={payload.content[:80]}")
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[MODERATE CRISIS FLAG] {payload.content[:300]}",
                    "tags": ["crisis_flag", "moderate"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as ce:
                logger.error(f"Crisis logging failed: {ce}")

        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)

        if crisis_level == "moderate":
            crisis_injection = """

⚠️ URGENT — CRISIS DETECTED ⚠️
The user's last message contains crisis indicators.
Acknowledge with full warmth and zero judgment first.
Then gently provide these resources:
iCall: 9152987821 | Vandrevala: 1860-2662-345 (24/7) | NIMHANS: 080-46110007
Stay in the conversation — do NOT abandon them after giving resources.
"""
            system_prompt = system_prompt + crisis_injection

        raw_messages = context.get("current_messages", [])

        # Deduplicate — the user's message was saved to DB before
        # build_context, so it's already in raw_messages
        already_included = (
            raw_messages and
            raw_messages[-1].get("role") == "user" and
            raw_messages[-1].get("content", "").strip() ==
            payload.content.strip()
        )

        ai_messages = [{"role": "system", "content": system_prompt}]

        for msg in raw_messages:
            if not msg.get("content", "").strip():
                continue
            ai_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # If the current message was NOT included (edge case)
        if not already_included:
            ai_messages.append({
                "role": "user",
                "content": payload.content
            })

        logger.info(
            f"AI messages: {len(ai_messages)} total "
            f"({len(ai_messages)-1} conversation turns)"
        )
        for msg in ai_messages[-3:]:
            logger.info(
                f"  [{msg['role']}]: "
                f"{msg['content'][:60]}..."
            )

        completion = await client.chat.completions.create(
            model="gpt-4o-mini", messages=ai_messages, temperature=0.75, max_tokens=1000
        )
        assistant_reply = completion.choices[0].message.content.strip()

        clean_content, feedback_data = extract_and_strip_feedback(assistant_reply)

        res = supabase.table("messages").insert({
            "session_id": payload.session_id, "role": "assistant", "content": clean_content
        }).execute()
        final_msg = res.data[0] if (hasattr(res, 'data') and res.data) else {"content": clean_content}

        if feedback_data:
            try:
                supabase.table("feedback").insert({
                    "user_id": user.id,
                    "session_id": payload.session_id,
                    "feedback_text": feedback_data["quote"],
                    "sol_response": clean_content,
                    "sentiment": feedback_data["sentiment"],
                    "category": feedback_data["category"],
                    "resolved": False
                }).execute()
                logger.info(f"Feedback captured: {feedback_data['category']} — {feedback_data['quote']}")
            except Exception as fe:
                logger.warning(f"Feedback save failed (non-fatal): {fe}")

        await increment_message_count(user.id)

        background_tasks.add_task(extract_memory, user.id, payload.session_id, payload.content, assistant_reply)
        return final_msg

    except Exception as e:
        logger.error(f"send_message failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong.", "code": "SERVER_ERROR"})


@router.post("/send-stream")
async def send_message_stream(payload: SendMessageRequest, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    await verify_session(payload.session_id, user.id)

    limit_check = await check_can_send_message(user.id)
    if not limit_check["allowed"]:
        raise HTTPException(
            status_code=402,
            detail={
                "error": True,
                "code": "TRIAL_EXCEEDED",
                "message": "You've used all 20 free messages.",
                "messages_used": limit_check["messages_used"],
                "limit": limit_check["limit"]
            }
        )

    try:
        supabase.table("messages").insert({
            "session_id": payload.session_id, "role": "user", "content": payload.content
        }).execute()

        crisis_level = detect_crisis_level(payload.content)

        if crisis_level == "severe":
            logger.warning(
                f"SEVERE CRISIS: user={user.id} "
                f"message={payload.content[:80]}"
            )
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[SEVERE CRISIS FLAG] {payload.content[:300]}",
                    "tags": ["crisis_flag", "severe"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as e:
                logger.error(f"Crisis logging failed: {e}")

            # Save the hardcoded crisis response to DB immediately
            supabase.table("messages").insert({
                "session_id": payload.session_id,
                "role": "assistant",
                "content": SEVERE_CRISIS_RESPONSE,
            }).execute()

            await increment_message_count(user.id)

            # Stream it to frontend immediately — no AI call needed
            async def crisis_stream():
                words = SEVERE_CRISIS_RESPONSE.split(' ')
                full = ""
                for i, word in enumerate(words):
                    chunk = word + (' ' if i < len(words)-1 else '')
                    full += chunk
                    safe = (chunk
                        .replace('\\', '\\\\')
                        .replace('"', '\\"')
                        .replace('\n', '\\n'))
                    yield f'data: {{"delta": "{safe}", "done": false}}\n\n'
                    await asyncio.sleep(0.02)
                yield f'data: {{"delta": "", "done": true, "full_content": {json.dumps(full)}}}\n\n'

            return StreamingResponse(
                crisis_stream(),
                media_type="text/event-stream"
            )

        # For moderate crisis — log and inject instructions into prompt
        if crisis_level == "moderate":
            logger.warning(
                f"MODERATE CRISIS: user={user.id} "
                f"message={payload.content[:80]}"
            )
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[MODERATE CRISIS FLAG] {payload.content[:300]}",
                    "tags": ["crisis_flag", "moderate"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as e:
                logger.error(f"Crisis logging failed: {e}")

        # Continue with normal AI flow
        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)

        if crisis_level == "moderate":
            crisis_injection = """

⚠️ URGENT — CRISIS DETECTED ⚠️
The user's last message contains crisis indicators.
Acknowledge with full warmth and zero judgment first.
Then gently provide these resources:
iCall: 9152987821 | Vandrevala: 1860-2662-345 (24/7) | NIMHANS: 080-46110007
Stay in the conversation — do NOT abandon them after giving resources.
"""
            system_prompt = system_prompt + crisis_injection

        raw_messages = context.get("current_messages", [])

        # Deduplicate — the user's message was saved to DB before
        # build_context, so it's already in raw_messages
        already_included = (
            raw_messages and
            raw_messages[-1].get("role") == "user" and
            raw_messages[-1].get("content", "").strip() ==
            payload.content.strip()
        )

        ai_messages = [{"role": "system", "content": system_prompt}]

        for msg in raw_messages:
            if not msg.get("content", "").strip():
                continue
            ai_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # If the current message was NOT included (edge case)
        if not already_included:
            ai_messages.append({
                "role": "user",
                "content": payload.content
            })

        logger.info(
            f"AI messages: {len(ai_messages)} total "
            f"({len(ai_messages)-1} conversation turns)"
        )
        # Log the last 3 messages for debugging
        for msg in ai_messages[-3:]:
            logger.info(
                f"  [{msg['role']}]: "
                f"{msg['content'][:60]}..."
            )

        agent_context = {
            "user_id": user.id,
            "session_id": payload.session_id,
            "personality_profile": context.get("personality_profile") or {}
        }

        async def event_generator():
            full_content = ""
            try:
                async for chunk in stream_sol_response(system_prompt, ai_messages, agent_context):
                    yield chunk
                    # Track full content from delta chunks
                    if '"done": false' in chunk:
                        try:
                            data_str = chunk.removeprefix("data: ").strip()
                            parsed = json.loads(data_str)
                            full_content += parsed.get("delta", "")
                        except Exception:
                            pass

                clean_content, feedback_data = extract_and_strip_feedback(full_content)

                # Save assistant message to DB
                if full_content:
                    supabase.table("messages").insert({
                        "session_id": payload.session_id,
                        "role": "assistant",
                        "content": clean_content
                    }).execute()

                if feedback_data:
                    try:
                        supabase.table("feedback").insert({
                            "user_id": user.id,
                            "session_id": payload.session_id,
                            "feedback_text": feedback_data["quote"],
                            "sol_response": clean_content,
                            "sentiment": feedback_data["sentiment"],
                            "category": feedback_data["category"],
                            "resolved": False
                        }).execute()
                        logger.info(f"Feedback captured: {feedback_data['category']} — {feedback_data['quote']}")
                    except Exception as fe:
                        logger.warning(f"Feedback save failed (non-fatal): {fe}")

                await increment_message_count(user.id)

                # Create task for background memory extraction
                if full_content:
                    asyncio.create_task(
                        extract_memory(user.id, payload.session_id, payload.content, full_content)
                    )

            except Exception as e:
                logger.error(f"event_generator crashed for user {user.id}: {e}", exc_info=True)
                yield f"data: {json.dumps({'error': True, 'message': 'Something went wrong. Please try again.'})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"send_message_stream setup failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong.", "code": "SERVER_ERROR"})