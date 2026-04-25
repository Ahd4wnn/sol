import os
import json
import logging

# Force chat completions, not responses API
os.environ["OPENAI_AGENTS_DISABLE_RESPONSES_API"] = "true"

from app.config import settings
os.environ["OPENAI_API_KEY"] = settings.openai_api_key

from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, RunContextWrapper
from agents import set_default_openai_client
from app.services.supabase_client import supabase
from app.services.memory_service import save_structured_memory

logger = logging.getLogger("sol")

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
set_default_openai_client(openai_client)


@function_tool
async def remember_fact(
    context: RunContextWrapper,
    memory_type: str,
    data: str
) -> str:
    """
    Save an important fact about the user to long-term memory.

    Call this when the user shares something worth remembering
    across sessions. Be very selective — only call for facts
    that will still matter in future sessions.

    memory_type options:
      "user_identity" — the user's own name, age, university, etc.
        data format: "key=name,value=Adon"
      "relationship" — an important person in their life
        data format: "person=Laya,relation=love_interest"
      "fact" — a specific true thing about their life
        data format: "Laya is in the user's class"
      "pattern" — a recurring behaviour or thought pattern
        data format: "tends to avoid expressing feelings directly"
      "goal" — something they are actively working toward
        data format: "wants to build confidence to talk to Laya"

    DO NOT save:
    - Current session mood
    - Things said only in this conversation
    - Anything that might change week to week
    """
    try:
        user_id = context.context.get("user_id", "")
        session_id = context.context.get("session_id", "")

        structured = {}

        if memory_type == "user_identity":
            # Parse "key=name,value=Adon"
            parts = dict(p.split("=", 1) for p in data.split(",")
                        if "=" in p)
            structured = {
                "type": "user_identity",
                "key": parts.get("key", "info"),
                "value": parts.get("value", data),
            }

        elif memory_type == "relationship":
            # Parse "person=Laya,relation=love_interest"
            parts = dict(p.split("=", 1) for p in data.split(",")
                        if "=" in p)
            structured = {
                "type": "relationship",
                "person": parts.get("person", "unknown"),
                "relation": parts.get("relation", "known person"),
            }

        else:
            structured = {
                "type": memory_type,
                "content": data,
            }

        success = await save_structured_memory(
            user_id, session_id, structured
        )

        if success:
            logger.info(f"Memory saved: {structured}")
            return f"Remembered: {data}"
        return "Could not save memory."

    except Exception as e:
        logger.error(f"remember_fact failed: {e}")
        return "Could not save memory."


@function_tool
async def log_mood_snapshot(
    context: RunContextWrapper,
    mood: str,
    note: str
) -> str:
    """
    Save user's current mood.
    mood: awful / rough / okay / good / great
    note: one sentence about why.
    Only call when user explicitly describes their mood.
    """
    try:
        user_id = context.context["user_id"]
        session_id = context.context["session_id"]
        supabase.table("memory_notes").insert({
            "user_id": user_id,
            "note": f"[mood] Felt {mood}: {note}",
            "memory_type": "mood",
            "memory_value": mood,
            "tags": ["mood_snapshot"],
            "source_session_id": session_id
        }).execute()
        return f"Mood logged: {mood}"
    except Exception as e:
        logger.error(f"log_mood_snapshot failed: {e}")
        return "Could not log mood."


def build_sol_agent(system_prompt: str) -> Agent:
    return Agent(
        name="Sol",
        model="gpt-4o-mini",
        instructions=system_prompt,
        tools=[remember_fact, log_mood_snapshot],
    )


async def stream_sol_response(
    system_prompt: str,
    messages: list,
    agent_context: dict
):
    messages = messages or []

    # Log exactly what the AI receives
    logger.info(f"AI receives {len(messages)} messages:")
    for i, m in enumerate(messages):
        logger.info(
            f"  [{i}] [{m['role']}]: {m['content'][:80]}"
        )

    full_response = ""

    try:
        # Direct chat completions — fast, reliable
        stream = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.75,
            max_tokens=1000,
            stream=True
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_response += delta
                safe_delta = (
                    delta
                    .replace('\\', '\\\\')
                    .replace('"', '\\"')
                    .replace('\n', '\\n')
                    .replace('\r', '\\r')
                )
                yield (
                    f'data: {{"delta": "{safe_delta}", '
                    f'"done": false}}\n\n'
                )

        yield (
            f'data: {{"delta": "", "done": true, '
            f'"full_content": {json.dumps(full_response)}}}\n\n'
        )

        # Run memory extraction AFTER streaming — non-blocking
        import asyncio
        asyncio.create_task(
            _extract_memories_async(
                system_prompt,
                messages,
                full_response,
                agent_context
            )
        )

    except Exception as e:
        logger.error(f"stream failed: {e}", exc_info=True)
        yield (
            f'data: {{"error": true, '
            f'"message": "Something went wrong.", '
            f'"done": true}}\n\n'
        )


async def _extract_memories_async(
    system_prompt: str,
    messages: list,
    full_response: str,
    agent_context: dict
):
    """
    Runs after streaming completes.
    Uses the agent to extract and save memories from the exchange.
    This never blocks the user-facing response.
    """
    try:
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break

        if not user_msg:
            return

        agent = build_sol_agent("""
You are a memory extraction agent.
Your ONLY job is to identify important facts from this
therapy conversation exchange and save them using the
remember_fact tool.

Save ONLY:
- The user's own name if mentioned
- Names and relations of important people
- Significant life facts that will matter in future sessions
- Recurring patterns in how they think or behave
- Important goals they have stated

DO NOT save:
- Current feelings or mood (use log_mood_snapshot for that)
- Session-specific context
- Anything that changes week to week

Be selective. 0-2 memories per exchange is normal.
Do not fabricate or assume. Only save what was explicitly stated.
""")

        await Runner.run(
            agent,
            input=(
                f"User said: {user_msg}\n"
                f"Sol responded: {full_response[:300]}\n\n"
                f"Extract and save any important memories."
            ),
            context=agent_context,
        )
        logger.info("Memory extraction completed")

    except Exception as e:
        logger.warning(f"Memory extraction failed (non-fatal): {e}")