"""Unified async LLM client for Claude.

Two backends, auto-selected at call time:
  1. Production / self-hosted  -> direct Anthropic SDK   (env: ANTHROPIC_API_KEY)
  2. Emergent dev environment  -> emergentintegrations   (env: EMERGENT_LLM_KEY)

ANTHROPIC_API_KEY takes priority. If neither key is set, LLMNotConfigured is
raised so callers can degrade gracefully instead of crashing the request.
"""
import os

# Current Claude Sonnet model id (valid for both Anthropic SDK & emergentintegrations).
CLAUDE_MODEL = "claude-sonnet-4-6"


class LLMNotConfigured(RuntimeError):
    """Raised when no LLM provider/API key is configured."""


def llm_available() -> bool:
    """True if at least one LLM provider key is configured."""
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("EMERGENT_LLM_KEY"))


async def llm_complete(
    system_message: str,
    user_text: str,
    *,
    session_id: str = "default",
    max_tokens: int = 2000,
    model: str = CLAUDE_MODEL,
) -> str:
    """Send a single-turn prompt to Claude and return the reply text.

    Raises LLMNotConfigured if no provider key is available.
    """
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=anthropic_key)
        message = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_message,
            messages=[{"role": "user", "content": user_text}],
        )
        return message.content[0].text

    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if emergent_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except Exception as exc:  # library only ships inside the Emergent env
            raise LLMNotConfigured("emergentintegrations unavailable") from exc

        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id,
            system_message=system_message,
        ).with_model("anthropic", model)
        reply = await chat.send_message(UserMessage(text=user_text))
        return str(reply)

    raise LLMNotConfigured(
        "No LLM key configured. Set ANTHROPIC_API_KEY (production) "
        "or EMERGENT_LLM_KEY (Emergent dev)."
    )
