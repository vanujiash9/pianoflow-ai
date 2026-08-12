from __future__ import annotations

import json
import logging
import time
from typing import TypedDict

try:
    from openai import OpenAI
except ImportError:  # installed by project dependencies when AI is enabled
    OpenAI = None
from sqlalchemy.orm import Session

from app.ai.tools import TOOL_SCHEMAS, ShopAITools
from app.core.config import Settings

try:
    from langgraph.graph import END, START, StateGraph
except ImportError:  # allows the CRUD app and tests to run before optional AI deps are installed
    END = START = StateGraph = None


SYSTEM_PROMPT = """Bạn là trợ lý nội bộ cho cửa hàng piano.
Nhiệm vụ của bạn là giúp chủ shop và nhân viên tra cứu dữ liệu vận hành nhanh hơn.

Nguyên tắc:
- Với dữ liệu khách hàng, đàn, bảo hành, bảo trì, lead hoặc số liệu shop: luôn dùng tool nếu cần dữ liệu.
- Không tự bịa tên khách, model, serial, ngày bảo hành hay lịch sử mua.
- Nếu tìm thấy nhiều khách trùng tên, hãy nêu ngắn gọn các lựa chọn và yêu cầu người dùng chỉ rõ.
- Không tiết lộ dữ liệu không liên quan đến câu hỏi.
- Trả lời ngắn, rõ, ưu tiên tiếng Việt.
"""


class AgentState(TypedDict):
    messages: list[dict]
    tool_calls_used: list[str]


logger = logging.getLogger(__name__)


class ShopAgent:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.settings = settings
        self.tools = ShopAITools(db)
        if OpenAI is None:
            raise RuntimeError("Install backend dependencies before enabling AI: openai is missing")
        self.client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            timeout=settings.llm_timeout_seconds,
        )
        self.mode = "langgraph" if StateGraph is not None else "manual"
        self.graph = self._build_graph() if StateGraph is not None else None

    @property
    def model(self) -> str:
        return self.settings.llm_model

    @property
    def history_limit(self) -> int:
        return self.settings.ai_history_limit

    @property
    def tool_count(self) -> int:
        return 0

    def invoke(self, messages: list[dict]) -> tuple[str, list[str], str]:
        initial: AgentState = {
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
            "tool_calls_used": [],
        }
        if self.graph is not None:
            result = self.graph.invoke(initial)
        else:
            result = self._manual_loop(initial)
        final_message = result["messages"][-1]
        return final_message.get("content") or "Không có câu trả lời.", result["tool_calls_used"], self.mode

    def _build_graph(self):
        graph = StateGraph(AgentState)
        graph.add_node("reason", self._reason_node)
        graph.add_node("tools", self._tool_node)
        graph.add_edge(START, "reason")
        graph.add_conditional_edges("reason", self._route_after_reason, {"tools": "tools", "end": END})
        graph.add_edge("tools", "reason")
        return graph.compile()

    def _manual_loop(self, state: AgentState) -> AgentState:
        for _ in range(6):
            state = self._reason_node(state)
            if self._route_after_reason(state) == "end":
                return state
            state = self._tool_node(state)
        state["messages"].append(
            {"role": "assistant", "content": "Mình chưa hoàn tất được yêu cầu sau nhiều bước xử lý."}
        )
        return state

    def _reason_node(self, state: AgentState) -> AgentState:
        started_at = time.perf_counter()
        completion = self.client.chat.completions.create(
            model=self.settings.llm_model,
            messages=state["messages"],
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
            temperature=0.1,
        )
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        message = completion.choices[0].message
        payload: dict = {"role": "assistant", "content": message.content or ""}
        if message.tool_calls:
            payload["tool_calls"] = [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {
                        "name": call.function.name,
                        "arguments": call.function.arguments,
                    },
                }
                for call in message.tool_calls
            ]
        logger.info(
            "ai_provider completed model=%s mode=%s tool_calls=%s elapsed_ms=%.2f",
            self.settings.llm_model,
            self.mode,
            len(message.tool_calls or []),
            elapsed_ms,
        )
        return {"messages": [*state["messages"], payload], "tool_calls_used": state["tool_calls_used"]}

    @staticmethod
    def _route_after_reason(state: AgentState) -> str:
        return "tools" if state["messages"][-1].get("tool_calls") else "end"

    def _tool_node(self, state: AgentState) -> AgentState:
        last = state["messages"][-1]
        new_messages = list(state["messages"])
        used = list(state["tool_calls_used"])
        for call in last.get("tool_calls", []):
            name = call["function"]["name"]
            try:
                arguments = json.loads(call["function"]["arguments"] or "{}")
                result = self.tools.execute(name, arguments)
            except (json.JSONDecodeError, TypeError) as error:
                result = {"error": f"Invalid tool call for {name}: {error}"}
            used.append(name)
            new_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                }
            )
        return {"messages": new_messages, "tool_calls_used": used}
