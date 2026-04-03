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
from app.services.subscription_service import check_can_send_message, increment_message_count

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

        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)
        ai_messages = [{"role": "system", "content": system_prompt}] + (context.get("current_messages") or [])

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

        context = await build_context(user.id, payload.session_id)
        system_prompt = build_system_prompt(context)
        ai_messages = [{"role": "system", "content": system_prompt}] + (context.get("current_messages") or [])
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

                # Run memory extraction in background
                if full_content:
                    asyncio.create_task(
                        extract_memory(user.id, payload.session_id, payload.content, full_content)
                    )

                # Crisis flag check — filter in Python, not with LIKE on array column
                try:
                    crisis_res = supabase.table("memory_notes")\
                        .select("note, tags")\
                        .eq("source_session_id", payload.session_id)\
                        .eq("user_id", user.id)\
                        .order("created_at", desc=True)\
                        .limit(10).execute()

                    has_crisis = any(
                        isinstance(n.get("tags"), list) and "crisis_flag" in n["tags"]
                        for n in (crisis_res.data or [])
                    )

                    if has_crisis:
                        follow_up = (
                            "\n\n---\nSol wants you to know: if things ever feel too heavy "
                            "to carry alone, you don't have to. Reaching out to someone trained "
                            "to help is a sign of strength, not weakness.\n\n"
                            "**iCall (India):** 9152987821\n"
                            "**Vandrevala Foundation:** 1860-2662-345 (24/7)\n"
                            "**iCharity (Kerala):** 0484-2361161"
                        )
                        supabase.table("messages").insert({
                            "session_id": payload.session_id,
                            "role": "assistant",
                            "content": follow_up
                        }).execute()
                except Exception as crisis_err:
                    logger.warning(f"Crisis check failed (non-fatal): {crisis_err}")

            except Exception as e:
                logger.error(f"event_generator crashed for user {user.id}: {e}", exc_info=True)
                yield f"data: {json.dumps({'error': True, 'message': 'Something went wrong. Please try again.'})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"send_message_stream setup failed for user {user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": True, "message": "Something went wrong.", "code": "SERVER_ERROR"})