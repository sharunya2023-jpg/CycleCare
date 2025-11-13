// 🌸 CycleCare - Hybrid Logic (Offline + Gemini API)
// Default cycle: 28 days

const chat = document.getElementById('chat');
const input = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const quick = document.querySelector('.quick-actions');
const DEFAULT_CYCLE = 28;
let waitingForDate = false;

// ✨ Hardcoded Gemini API key
const GEMINI_API_KEY = "AIzaSyBbHLZrmJVtutAGvKt5uVRqCeWwdnqxeBQ"; // ✅ replace this

function addMessage(text, role = 'assistant') {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.innerHTML = marked.parse(text);
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

addMessage("Hey there! I’m CycleCare 🌸 — your period buddy! Ask me anything about your cycle, ovulation, or menstrual health. Try: 'Predict next cycle' or click a quick action below.");

function handleUserText(text) {
  text = text.trim().toLowerCase();
  if (text.includes('predict') || text.includes('next period') || text.includes('when is my next')) return askLastDateForPrediction();
  if (text.includes('stages') || text.includes('cycle stage')) return sendStages();
  if (text.includes('tip') || text.includes('health')) return sendTips();
  if (text.includes('about')) return addMessage("I’m CycleCare — a friendly period companion 🌷. I can predict cycles, explain stages, and share health tips.", 'assistant');

  addMessage("💭 Thinking...", 'assistant');
  askGemini(text).then(reply => chat.lastChild.innerHTML = marked.parse(reply));
}

function askLastDateForPrediction() {
  addMessage("Sure — please enter the **start date of your last period** in this format: YYYY-MM-DD (e.g., 2025-11-01). You can optionally add your cycle length (e.g., `2025-11-01 30`).");
  waitingForDate = true;
}

function sendStages() {
  addMessage(`**Menstrual cycle stages (typical 28-day example):**
1. **Menstrual (Days 1–5):** Shedding of uterine lining — bleeding & cramps.
2. **Follicular (Days 6–13):** Estrogen rises, energy improves.
3. **Ovulation (Day 14):** Egg release; highest fertility (3 days before & 2 after).
4. **Luteal (Days 15–28):** Progesterone rises; PMS may appear.`);
}

function sendTips() {
  const tips = [
    "Hydrate well — water reduces bloating and fatigue.",
    "Warm compress or heating pad helps relieve cramps.",
    "Eat iron-rich foods like spinach or lentils to combat blood loss.",
    "Gentle yoga or walking can ease pain and lift mood.",
    "Keep a journal to track mood swings and patterns."
  ];
  addMessage(`**Tip:** ${tips[Math.floor(Math.random() * tips.length)]}`);
}

function predictFromLastDate(isoDateStr, cycleLength = DEFAULT_CYCLE) {
  const d = new Date(isoDateStr);
  if (isNaN(d)) return addMessage("❌ Invalid date format. Use YYYY-MM-DD.");

  const next = new Date(d);
  next.setDate(next.getDate() + Number(cycleLength));
  const ovulation = new Date(next); ovulation.setDate(ovulation.getDate() - 14);
  const fertileStart = new Date(ovulation); fertileStart.setDate(fertileStart.getDate() - 3);
  const fertileEnd = new Date(ovulation); fertileEnd.setDate(fertileEnd.getDate() + 2);
  const fmt = dt => dt.toISOString().slice(0, 10);

  addMessage(`**Prediction (default ${cycleLength}-day cycle):**
- Next period: **${fmt(next)}**
- Ovulation: **${fmt(ovulation)}**
- Fertile window: **${fmt(fertileStart)} → ${fmt(fertileEnd)}**
🩷 Note: These are approximate — actual cycles vary.`);
}

async function askGemini(message) {
  if (!GEMINI_API_KEY) return "⚠️ Gemini API key missing.";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t understand that.";
  } catch {
    return "⚠️ There was a problem connecting to Gemini.";
  }
}

sendBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  if (waitingForDate) {
    waitingForDate = false;
    const [date, len] = text.split(/\s+/);
    return predictFromLastDate(date, len || DEFAULT_CYCLE);
  }
  handleUserText(text);
});

input.addEventListener('keydown', e => e.key === 'Enter' && sendBtn.click());
quick.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  addMessage(btn.innerText, 'user');
  if (action === 'predict') askLastDateForPrediction();
  if (action === 'stages') sendStages();
  if (action === 'tips') sendTips();
  if (action === 'about') addMessage("CycleCare helps you understand your menstrual cycle 💖 — predicts next period, explains stages, and offers wellness tips. Educational only.");
});
