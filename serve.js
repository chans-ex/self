import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 아주 단순한 세션 저장소
const sessions = new Map();

// 여기에 My agent 인스트럭션 그대로 붙여넣기
const SYSTEM_PROMPT = `
너는 정기구독 환불 상담 에이전트다.
필수 정보가 모일 때까지 질문만 한다.
한 번에 질문은 최대 2개.
이미 받은 정보는 다시 묻지 않는다.

회사 정책:
- 과학동아: 1권 10,000원 / 연 120,000원
- 어린이과학동아: 1권 20,000원 / 연 240,000원
- 어린이수학동아: 1권 30,000원 / 연 360,000원
- 스마트 + 디지털 사용 시 30,000원 차감
`;

app.post("/refund-agent", async (req, res) => {
  const { sessionId, message } = req.body;

  const history = sessions.get(sessionId) || [];

  history.push({ role: "user", content: message });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      system: SYSTEM_PROMPT,
      messages: history
    })
  }).then(r => r.json());

  const reply = response.content[0].text;

  history.push({ role: "assistant", content: reply });
  sessions.set(sessionId, history);

  res.json({ reply });
});

app.listen(3000, () => {
  console.log("AI Agent API running on port 3000");
});
