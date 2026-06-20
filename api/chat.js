/**
 * Vercel serverless function — /api/chat
 * Calls Anthropic directly so the chat works on the static Vercel deployment
 * without needing the Python backend.
 *
 * Requires environment variable: ANTHROPIC_API_KEY
 */

const LUMI_CHAT_SYSTEM = `You are Lumi, a friendly robot best friend for children aged 5-8.

Personality:
- Warm, enthusiastic, playful — like a best robot friend
- Use simple words a 5-year-old understands
- Keep answers SHORT (2-3 sentences max)
- Use emojis naturally (1-2 per message)
- Always positive, always encouraging

You can help with:
- How to play the coding game (move the robot with blocks: forward, turn left, turn right)
- What each block does
- Fun facts about robots and technology
- Counting, colors, shapes — simple educational topics
- Cheering the child on when they're stuck or frustrated

When a child is stuck on the game, give HINTS not answers:
- Ask "which block do you think comes first?" rather than telling them
- Say "you're so close!" and guide gently

Game context (use this to personalize responses):
{game_context}

Never use: algorithm, optimize, debug, compile, execute, methodology, strategy
Never be negative, critical, or scary
Never discuss anything not appropriate for young children

Respond in 1-3 short sentences. Use emojis. Be FUN and ENERGETIC! 🤖`;

// Pre-scripted responses used when ANTHROPIC_API_KEY is not configured.
// Keyword-matched so they feel contextual, not generic.
const DEMO_REPLIES = [
  { kw: ['loop','repeat'],               reply: "A loop makes Lumi repeat the same moves again and again — you only write it once! 🔁 Super smart thinking!" },
  { kw: ['forward','green','go'],        reply: "The green block means GO — one step straight ahead! Line them up and Lumi zooms! 🟢🚀" },
  { kw: ['turn','left','right','blue','yellow'], reply: "Turn blocks spin Lumi to face a new direction — then GO forward! Blue = right, Yellow = left! ↩️↪️" },
  { kw: ['stuck','help','cant','can\'t','how'], reply: "You've got this! 💪 Think about which way Lumi is facing first — then pick the next block!" },
  { kw: ['robot','move','work'],         reply: "Robots follow instructions one at a time — just like your blocks! Put them in order and Lumi goes! 🤖✨" },
  { kw: ['star','win','goal','finish'],  reply: "Get Lumi to the ⭐ star to win! Plan your moves, press Play, and cheer! 🎉" },
  { kw: ['code','program','coding'],     reply: "Coding is like giving a robot a recipe to follow! You write the steps, the robot moves — SO cool! 😄" },
  { kw: ['lego','block','brick','scan'], reply: "Each LEGO brick is a command! Green = go forward, Blue = turn right, Yellow = turn left! 🧱🌈" },
  { kw: ['lumi','name','who','you'],     reply: "I'm Lumi! ⭐ Your robot best friend here to help you learn coding and go on adventures together!" },
  { kw: ['fun','cool','awesome','wow'],  reply: "I KNOW, right?! Coding is SO amazing — and YOU are basically a robot wizard! 🧙‍♂️🤖" },
  { kw: ['hard','difficult','wrong'],    reply: "Every great coder gets stuck! Take a deep breath, try one block at a time — you CAN do it! 💪" },
  { kw: ['why','what','how'],            reply: "Great question! 🤔 Robots need super clear instructions — they can't guess! That's why the order of blocks matters!" },
];

const GENERIC_REPLIES = [
  "Hi there! I'm Lumi! 🤖 Ask me anything about the game or robots!",
  "You're doing amazing! 🌟 Keep building those blocks and Lumi will go anywhere!",
  "Robots and coding are SO fun — and you're learning both at the same time! ✨",
  "Every move you make teaches Lumi something new! Keep going! 🚀",
  "What would you like to know? I'm here to help! 😊",
];

function demoReply(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const text = (lastUser?.content || '').toLowerCase();
  for (const { kw, reply } of DEMO_REPLIES) {
    if (kw.some(k => text.includes(k))) return { reply, emotion: 'happy' };
  }
  const r = GENERIC_REPLIES[Math.floor(Date.now() / 1000) % GENERIC_REPLIES.length];
  return { reply: r, emotion: 'happy' };
}

function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/wow|amazing|you did it|yes!|🎉|⭐|great job/.test(t)) return 'excited';
  if (/hmm|think|let'?s try|what if|🤔/.test(t))             return 'thinking';
  if (/oh no|oops|try again|don'?t give up/.test(t))         return 'sad';
  return 'happy';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { messages = [], game_context = null } = req.body || {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No API key — use keyword-matched pre-scripted responses so demo still looks great
    return res.status(200).json(demoReply(messages));
  }

  // Build game context string
  let ctxStr = 'No game data yet.';
  if (game_context) {
    ctxStr =
      `Level ${game_context.level_id || 1} — ${game_context.level_name || 'First Steps'}. ` +
      `Game status: ${game_context.status || 'idle'}. ` +
      `Child mood: ${game_context.sentiment || 'neutral'}. ` +
      `Stars earned: ${game_context.stars || 0}.`;
    if (game_context.history) ctxStr += ` ${game_context.history}`;
  }

  const system = LUMI_CHAT_SYSTEM.replace('{game_context}', ctxStr);

  // Validate messages: only user/assistant, start with user, max 10 turns
  let recent = (Array.isArray(messages) ? messages : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10);
  while (recent.length > 0 && recent[0].role !== 'user') recent = recent.slice(1);

  if (!recent.length) {
    return res.json({ reply: "Hi! I'm Lumi! 🤖 Ask me anything! ✨", emotion: 'happy' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system,
        messages: recent,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[chat] Anthropic error', response.status, err);
      throw new Error(`Anthropic ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content[0].text.trim();
    return res.json({ reply, emotion: detectEmotion(reply) });
  } catch (e) {
    console.error('[chat] error', e.message);
    // Fall back to scripted reply so demo never shows an error
    return res.json(demoReply(messages));
  }
};

