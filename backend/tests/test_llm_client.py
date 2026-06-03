"""Regression tests for the unified LLM client (production vs dev provider selection)."""
import sys
import importlib

import pytest


def _fresh_llm_client(monkeypatch, anthropic_key=None, emergent_key=None):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("EMERGENT_LLM_KEY", raising=False)
    if anthropic_key is not None:
        monkeypatch.setenv("ANTHROPIC_API_KEY", anthropic_key)
    if emergent_key is not None:
        monkeypatch.setenv("EMERGENT_LLM_KEY", emergent_key)
    sys.modules.pop("llm_client", None)
    return importlib.import_module("llm_client")


def test_llm_available_reflects_env(monkeypatch):
    mod = _fresh_llm_client(monkeypatch)
    assert mod.llm_available() is False

    mod = _fresh_llm_client(monkeypatch, anthropic_key="sk-ant-test")
    assert mod.llm_available() is True

    mod = _fresh_llm_client(monkeypatch, emergent_key="sk-emergent-test")
    assert mod.llm_available() is True


@pytest.mark.asyncio
async def test_llm_complete_raises_when_unconfigured(monkeypatch):
    mod = _fresh_llm_client(monkeypatch)
    with pytest.raises(mod.LLMNotConfigured):
        await mod.llm_complete("system", "hello", session_id="t")


@pytest.mark.asyncio
async def test_production_path_uses_anthropic_sdk(monkeypatch):
    """With ANTHROPIC_API_KEY set, llm_complete must call the Anthropic SDK (not emergentintegrations)."""
    mod = _fresh_llm_client(monkeypatch, anthropic_key="sk-ant-test")

    captured = {}

    class _Block:
        text = "hi from claude"

    class _Msg:
        content = [_Block()]

    class _Messages:
        async def create(self, **kwargs):
            captured.update(kwargs)
            return _Msg()

    class _FakeClient:
        def __init__(self, **kwargs):
            self.messages = _Messages()

    import anthropic
    monkeypatch.setattr(anthropic, "AsyncAnthropic", _FakeClient)

    out = await mod.llm_complete("sys", "user text", session_id="t", max_tokens=123)
    assert out == "hi from claude"
    assert captured["model"] == mod.CLAUDE_MODEL
    assert captured["max_tokens"] == 123
    assert captured["system"] == "sys"
