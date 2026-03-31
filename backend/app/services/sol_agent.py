import os
import json
import logging
from app.config import settings

os.environ["OPENAI_API_KEY"] = settings.openai_api_key

from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, RunContextWrapper, ModelSettings
from agents.models.openai_provider import OpenAIProvider
from agents.run import RunConfig
from agents.stream_events import RawResponsesStreamEvent
from openai.types.responses import ResponseTextDeltaEvent
from app.services.supabase_client import supabase

logger = logging.getLogger("sol")

# Create a shared OpenAI client with the key explicitly set
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

# Tell the agents SDK to use THIS client, not its own
from agents import set_default_openai_client
set_default_openai_client(openai_client)


@function_tool
async def log_mood_snapshot(context: RunContextWrapper, mood: str, note: str) -> str:
    """
    Call this when the user explicitly describes how they are feeling right now
    and it seems worth logging as a snapshot.
    mood must be one of: awful, rough, okay, good, great
    note is a one-sentence summary of why.
    """
    try:
        user_id = context.context["user_id"]
        session_id = context.context["session_id"]
        supabase.table("memory_notes").insert({
            "user_id": user_id,
            "note": f"[Mood snapshot] Felt {mood}: {note}",
            "tags": ["mood_snapshot"],
            "source_session_id": session_id
        }).execute()
        return f"Mood snapshot saved: {mood}"
    except Exception as e:
        logger.error(f"log_mood_snapshot failed: {e}")
        return "Could not save mood snapshot."


@function_tool
async def create_journal_entry(context: RunContextWrapper, title: str, body: str) -> str:
    """
    Call this when the user wants to process something deeply and a written
    reflection would help them. Write a compassionate journal entry in first
    person AS the user based on what they've shared.
    title: short title (5 words max)
    body: full journal entry (200-400 words) written as if the user wrote it
    """
    try:
        user_id = context.context["user_id"]
        session_id = context.context["session_id"]
        supabase.table("memory_notes").insert({
            "user_id": user_id,
            "note": f"[Journal] {title}\n\n{body}",
            "tags": ["journal"],
            "source_session_id": session_id
        }).execute()
        return f"Journal entry '{title}' saved."
    except Exception as e:
        logger.error(f"create_journal_entry failed: {e}")
        return "Could not save journal entry."


@function_tool
async def save_relationship_note(
    context: RunContextWrapper,
    person_name: str,
    relationship_type: str,
    summary: str
) -> str:
    """
    Call this when the user mentions a person who is clearly important in their
    life. Only call for NEW people not already in memory.
    person_name: their name or description (e.g. 'their mother')
    relationship_type: parent / sibling / friend / partner / professor / other
    summary: 1-2 sentences about this person and their dynamic with the user
    """
    try:
        user_id = context.context["user_id"]
        session_id = context.context["session_id"]
        supabase.table("memory_notes").insert({
            "user_id": user_id,
            "note": f"[Relationship] {person_name} ({relationship_type}): {summary}",
            "tags": ["relationship", relationship_type],
            "source_session_id": session_id
        }).execute()
        return f"Saved relationship note for {person_name}."
    except Exception as e:
        logger.error(f"save_relationship_note failed: {e}")
        return "Could not save relationship note."


@function_tool
async def suggest_coping_technique(
    context: RunContextWrapper,
    situation_type: str,
    preferred_style: str
) -> str:
    """
    Call this when the user needs an immediate coping strategy.
    situation_type: anxiety / grief / anger / overwhelm / loneliness /
                    academic_stress / relationship_conflict / low_motivation
    preferred_style: CBT_oriented / person_centered / coaching_oriented / insight_oriented
    """
    techniques = {
        "anxiety": {
            "CBT_oriented": "Try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This interrupts the anxiety loop by forcing sensory presence.",
            "person_centered": "Place one hand on your chest. Breathe in for 4 counts, hold for 4, out for 6. Just notice what's happening in your body without judging it.",
            "coaching_oriented": "Write down the single worst realistic outcome. Then write what you'd do if it happened. Anxiety shrinks when you have a plan.",
            "insight_oriented": "Ask yourself: what is this anxiety protecting me from? Sometimes anxiety is a boundary your mind is drawing around something important."
        },
        "overwhelm": {
            "CBT_oriented": "Brain dump everything onto paper — every task, worry, thought. Then pick just ONE thing to do next. The list stays on paper, not in your head.",
            "person_centered": "You don't have to solve everything right now. What's the one thing that, if handled, would make the rest feel lighter?",
            "coaching_oriented": "Do a 2-minute triage: urgent+important, important+not urgent, everything else. Work the top bucket only today.",
            "insight_oriented": "Overwhelm often means your expectations of yourself exceed what's realistic right now. What would you tell a friend in this exact situation?"
        },
        "loneliness": {
            "CBT_oriented": "Identify one small low-stakes social action: send a meme to a friend, sit in a busy cafe, text someone you haven't in a while. Isolation feeds loneliness; action breaks it.",
            "person_centered": "Loneliness is real and it's hard. You don't have to fix it right now. Sometimes just naming it out loud is the first step.",
            "coaching_oriented": "Pick one recurring activity where you'd be around people, even without conversation. Consistency builds familiarity, and familiarity builds connection.",
            "insight_oriented": "Loneliness sometimes points to a gap between the connections we have and the ones we need. What kind of connection are you actually craving right now?"
        },
        "academic_stress": {
            "CBT_oriented": "Break the task causing the most stress into steps so small they feel almost silly. Start with step one only. Momentum is everything.",
            "person_centered": "Academic pressure can feel like your entire worth is being graded. It isn't. You existed before this assignment and you'll exist after it.",
            "coaching_oriented": "Set a 25-minute Pomodoro on the hardest task. Just 25 minutes, full focus, then a 5-minute break. One block at a time.",
            "insight_oriented": "What does failing this actually mean to you, underneath the surface? Academic anxiety is often about something bigger — identity, expectation, fear of the future."
        },
        "grief": {
            "CBT_oriented": "Grief doesn't follow a schedule. Give yourself permission to feel without trying to fix it. Write down one memory you're grateful for today.",
            "person_centered": "There's no right way to grieve. Whatever you're feeling right now is valid — even if it doesn't make sense to you.",
            "coaching_oriented": "Grief is energy. When you're ready, channel it into one small action that honours what you've lost.",
            "insight_oriented": "Grief is love with nowhere to go. What does this loss tell you about what matters most to you?"
        },
        "low_motivation": {
            "CBT_oriented": "Action comes before motivation, not after. Pick one 2-minute task and do only that. Starting is the hardest part.",
            "person_centered": "Low motivation is often your mind asking for rest. Is there something you've been pushing through that needs acknowledgment first?",
            "coaching_oriented": "Reconnect with your why. Write one sentence about why this matters — not to anyone else, but to you.",
            "insight_oriented": "Sometimes low motivation is resistance in disguise. What are you afraid will happen if you actually try?"
        }
    }

    style = preferred_style if preferred_style in [
        "CBT_oriented", "person_centered", "coaching_oriented", "insight_oriented"
    ] else "person_centered"
    sit = situation_type if situation_type in techniques else "anxiety"

    return techniques.get(sit, {}).get(
        style,
        "Take a slow breath and give yourself permission to pause for 60 seconds. Nothing needs to be solved this instant."
    )


def build_sol_agent(system_prompt: str) -> Agent:
    return Agent(
        name="Sol",
        model="gpt-4o-mini",
        instructions=system_prompt,
        tools=[
            log_mood_snapshot,
            create_journal_entry,
            save_relationship_note,
            suggest_coping_technique,
        ],
        model_settings=ModelSettings(
            temperature=0.75,
            max_tokens=1000,
        )
    )


async def stream_sol_response(system_prompt: str, messages: list, agent_context: dict):
    messages = messages or []

    # Extract last user message
    user_input = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_input = msg.get("content", "")
            break

    if not user_input:
        yield 'data: {"delta": "I\'m here. What\'s on your mind?", "done": false}\n\n'
        yield 'data: {"delta": "", "done": true, "full_content": "I\'m here. What\'s on your mind?"}\n\n'
        return

    full_response = ""

    try:
        agent = build_sol_agent(system_prompt)
        run_config = RunConfig(
            model_provider=OpenAIProvider(openai_client=openai_client)
        )

        async with Runner.run_streamed(
            agent,
            input=user_input,
            context=agent_context,
            run_config=run_config,
        ) as stream:
            async for event in stream.stream_events():
                if isinstance(event, RawResponsesStreamEvent):
                    data = event.data
                    if isinstance(data, ResponseTextDeltaEvent):
                        delta = data.delta or ""
                        if delta:
                            full_response += delta
                            safe_delta = (
                                delta
                                .replace('\\', '\\\\')
                                .replace('"', '\\"')
                                .replace('\n', '\\n')
                                .replace('\r', '\\r')
                            )
                            yield f'data: {{"delta": "{safe_delta}", "done": false}}\n\n'

        yield f'data: {{"delta": "", "done": true, "full_content": {json.dumps(full_response)}}}\n\n'
        logger.info(f"Agent stream completed, response length: {len(full_response)}")

    except Exception as e:
        logger.error(f"Agent stream failed: {type(e).__name__}: {e}", exc_info=True)
        # Fallback to direct OpenAI streaming
        try:
            logger.info("Falling back to direct OpenAI streaming")
            full_response = ""
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
                    yield f'data: {{"delta": "{safe_delta}", "done": false}}\n\n'

            yield f'data: {{"delta": "", "done": true, "full_content": {json.dumps(full_response)}}}\n\n'

        except Exception as e2:
            logger.error(f"Fallback also failed: {type(e2).__name__}: {e2}")
            yield f'data: {{"error": true, "message": "Sol is having trouble responding. Please try again.", "done": true}}\n\n'