"""A typed question (`chat.text`) is answered by the same path as a spoken one: a "speak" feedback with the tutor's
answer, said aloud only when voice is already on. Reuses the scripted agent from the formula tests (no models)."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest
from inktutor_protocol import ChatText, ClientMessage
from pydantic import TypeAdapter, ValidationError
from test_formula import SPEAK, answer, make_agent


def run_chat(a: Any, text: str) -> None:
    async def go() -> None:
        await a.handle(ChatText(page_id="p1", text=text))
        if a.chat is not None:
            await a.chat

    asyncio.run(go())


def test_parses_as_a_client_message():
    msg = TypeAdapter(ClientMessage).validate_python({"type": "chat.text", "page_id": "p1", "text": "why 49?"})
    assert isinstance(msg, ChatText)
    with pytest.raises(ValidationError):
        ChatText(page_id="p1", text="")
    with pytest.raises(ValidationError):
        ChatText(page_id="p1", text="x" * 1001)


def test_typed_question_gets_a_speak_feedback_without_tts_when_voice_is_off():
    asked: list[tuple[str, Any]] = []
    script = answer(SPEAK)

    async def tutor(page: Any, kind: str, ctx: Any) -> Any:
        asked.append((kind, ctx))
        async for o in script(page, kind, ctx):
            yield o

    a, _, sent, eng = make_agent(tutor)
    a.voice = None  # voice off
    run_chat(a, "  why isn't 25 + 24 = 48?  ")
    assert [e.type for e in sent] == ["speak"]
    assert sent[0].text == SPEAK["text"] and sent[0].source == "tutor"
    assert asked and asked[0][0] == "converse" and asked[0][1].transcript == "why isn't 25 + 24 = 48?"
    assert eng.spoken == []  # nothing synthesized
    assert a.voice is None  # voice never turned on


def test_typed_question_is_spoken_when_voice_is_on():
    a, _, sent, eng = make_agent(answer(SPEAK))
    run_chat(a, "why isn't 25 + 24 = 48?")
    assert [e.type for e in sent] == ["speak"]
    assert eng.spoken


def test_blank_text_is_ignored():
    called: list[str] = []

    async def tutor(page: Any, kind: str, ctx: Any) -> Any:
        called.append(kind)
        yield SPEAK

    a, _, sent, _ = make_agent(tutor)
    a.voice = None
    run_chat(a, "   ")
    assert sent == [] and called == [] and a.chat is None
