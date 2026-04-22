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

CRISIS_KEYWORDS = [
    "want to die", "kill myself", "end my life",
    "suicide", "suicidal", "no reason to live",
    "better off dead", "better off without me",
    "don't want to be here", "can't do this anymore",
    "want to disappear forever", "ending it",
    "hurt myself", "cutting myself", "self harm",
    "self-harm", "overdose", "won't be here",
    "last message", "goodbye forever",
]

def detect_crisis(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in CRISIS_KEYWORDS)

logger = logging.getLogger("sol")

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

        is_crisis = detect_crisis(payload.content)
        if is_crisis:
            logger.warning(
                f"CRISIS DETECTED for user {user.id}: "
                f"{payload.content[:50]}..."
            )
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[CRISIS FLAG] Detected in message: "
                            f"{payload.content[:200]}",
                    "tags": ["crisis_flag"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as ce:
                logger.error(f"Crisis logging failed: {ce}")

        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)

        if is_crisis:
            crisis_injection = """

⚠️ URGENT — CRISIS DETECTED ⚠️
The user's last message contains crisis indicators.
Follow the CRISIS PROTOCOL exactly as specified above.
Step 1 first: acknowledge with warmth before anything else.
Do NOT skip to resources immediately.
Do NOT show alarm or panic in your response.
Stay calm, warm, and present.
"""
            system_prompt = system_prompt + crisis_injection

        raw_messages = context.get("current_messages", [])
        ai_messages = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in raw_messages:
            ai_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        if ai_messages and ai_messages[-1]["role"] != "user":
            ai_messages.append({
                "role": "user",
                "content": payload.content
            })

        logger.info(
            f"Sending {len(ai_messages)} messages to OpenAI "
            f"(1 system + {len(ai_messages)-1} conversation)"
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

        is_crisis = detect_crisis(payload.content)
        if is_crisis:
            logger.warning(
                f"CRISIS DETECTED for user {user.id}: "
                f"{payload.content[:50]}..."
            )
            try:
                supabase.table("memory_notes").insert({
                    "user_id": user.id,
                    "note": f"[CRISIS FLAG] Detected in message: "
                            f"{payload.content[:200]}",
                    "tags": ["crisis_flag"],
                    "source_session_id": payload.session_id,
                }).execute()
            except Exception as ce:
                logger.error(f"Crisis logging failed: {ce}")

        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)

        if is_crisis:
            crisis_injection = """

⚠️ URGENT — CRISIS DETECTED ⚠️
The user's last message contains crisis indicators.
Follow the CRISIS PROTOCOL exactly as specified above.
Step 1 first: acknowledge with warmth before anything else.
Do NOT skip to resources immediately.
Do NOT show alarm or panic in your response.
Stay calm, warm, and present.
"""
            system_prompt = system_prompt + crisis_injection

        raw_messages = context.get("current_messages", [])
        ai_messages = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in raw_messages:
            ai_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        if ai_messages and ai_messages[-1]["role"] != "user":
            ai_messages.append({
                "role": "user",
                "content": payload.content
            })

        logger.info(
            f"Sending {len(ai_messages)} messages to OpenAI "
            f"(1 system + {len(ai_messages)-1} conversation)"
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