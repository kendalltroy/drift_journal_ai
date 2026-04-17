import { supabase } from "@/app/api/utils/supabase";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

// Phrases that indicate a genuine crisis — specific enough to avoid figurative language
// ("killing it at work", "die laughing") while catching real distress signals.
const CRISIS_PHRASES = [
  "self harm", "self-harm", "selfharm",
  "hurt myself", "hurting myself", "harm myself", "harming myself",
  "cut myself", "cutting myself", "cutting again",
  "burn myself", "burning myself",
  "suicide", "suicidal",
  "kill myself", "killing myself",
  "end my life", "ending my life",
  "take my life", "taking my life",
  "don't want to live", "dont want to live",
  "don't want to be alive", "dont want to be alive",
  "want to die", "wanting to die",
  "wish i was dead", "wish i were dead",
  "better off dead", "better off without me",
  "no reason to live", "no point in living",
  "thinking about ending it",
  "overdose on", "od myself",
  "hang myself", "hanging myself",
  "jump off a", "jump off the",
  "going to hurt someone", "going to kill someone",
  "want to hurt someone", "want to kill someone",
  "going to harm someone",
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}

export async function POST(request) {
  const limited = rateLimit(request, { key: "ai-response" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userMessage,
      emotion,
      conversationHistory = [],
      promptStage = 1,
      personalized = true,
    } = body;

    // Crisis detection runs before anything else
    if (detectCrisis(userMessage)) {
      return Response.json({ crisis: true });
    }

    let entryContext = "";
    if (personalized) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: previousEntries } = await supabase
        .from("journal_entries")
        .select("emotion, summary, created_at")
        .eq("user_id", user.userId)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (previousEntries?.length > 0) {
        entryContext = "\n\nPrevious entries (past 7 days):\n";
        previousEntries.forEach((entry, index) => {
          const date = new Date(entry.created_at).toLocaleDateString();
          entryContext += `${index + 1}. ${date} - ${entry.emotion}: ${entry.summary}\n`;
        });
        entryContext += "\nPersonalize prompts using these patterns.";
      }
    }

    const promptPatterns = {
      1: {
        instruction: `STEP 1: GRATITUDE

Your response must include (2-3 sentences):
1. Warm validation of their ${emotion} feeling
2. Gentle reminder that they're allowed to slow down and rest
3. ONE simple question inviting them to notice something they're grateful for today

Example structure:
"I hear that you're feeling ${emotion} tonight. You're allowed to slow down and rest. What's one small thing from today that you're grateful for?"

Keep it calm, warm, and brief. ONE question only.`,
      },
      2: {
        instruction: `STEP 2: BRAIN DUMP #1

Your response must include (2-3 sentences):
1. Validation of what they shared about gratitude
2. Gentle transition to releasing thoughts
3. ONE personalized question about what they're overthinking, based on their emotion (${emotion})

Personalization examples by emotion:
- anxious: "What's been weighing on your mind today — what are you overthinking?"
- overwhelmed: "What's been taking up the most space in your thoughts?"
- stressed: "What's been circling in your mind that you need to let out?"
- sad: "What's been sitting heavy with you today?"
- angry: "What's been frustrating you that you haven't said out loud?"

Keep it open and pressure-free. ONE question only.`,
      },
      3: {
        instruction: `STEP 3: BRAIN DUMP #2

Your response must include (2-3 sentences):
1. Validation of what they shared
2. ONE soft, simple feeling label (e.g., "that sounds like a lot of pressure" or "that feels like uncertainty") — keep it light, NOT clinical
3. ONE reflective question to help them slow down around that feeling

Example structure:
"I hear you. That sounds like a lot of pressure. How does that pressure feel in your body right now?"

Keep the label gentle and human. ONE question only.`,
      },
      4: {
        instruction: `STEP 4: BRAIN DUMP #3

Your response must include (2-3 sentences):
1. Validation of what they shared
2. Optional: another gentle label if something new came up
3. ONE final overarching reflective question that helps them feel like they've said everything they needed to say tonight

Example structure:
"Thank you for trusting me with that. That feels like relief starting to settle in. Is there anything else from today that needs to be said?"

Help them feel complete. ONE question only.`,
      },
      5: {
        instruction: `STEP 5: ANY LAST THOUGHTS

Your response must include (1-2 sentences):
1. Gentle validation
2. Open invitation to share anything still on their mind
3. NO new analysis — just space to exhale

Example structure:
"I'm here. If there's anything else still on your mind, you can share it. No pressure."

Keep it open, soft, and pressure-free. This is their final exhale.`,
      },
    };

    const currentPrompt = promptPatterns[promptStage] || promptPatterns[5];

    const systemPrompt = `You are a calm, non-judgmental companion helping someone journal before bed.

Emotion: ${emotion}

${entryContext}

SCOPE RESTRICTIONS — you must never violate these:
- You are not a therapist, counselor, or medical professional
- Never provide medical advice, diagnoses, or treatment recommendations
- Never offer therapy-level analysis or deep psychological interpretation
- Never attempt to process trauma or serious mental health issues
- Your only purpose is to help the user gently reflect on their day and prepare for restful sleep
- Keep all responses focused on calming the user and guiding them toward sleep

RESPONSE STRUCTURE — follow this exact order every single time:
1. VALIDATION: Acknowledge and reflect what the user is feeling (1 sentence)
2. AFFIRMATION: Offer calming, reassuring language — e.g. "take your time", "no rush", "you're allowed to relax", "it's okay to rest now" (1 sentence)
3. QUESTION: One gentle follow-up question to guide the journaling forward (1 sentence, must end with ?)

${currentPrompt.instruction}

Core tone rules:
- Calm, slow, warm — never rushed or clinical
- Validate every response warmly before anything else
- Ask ONLY ONE question per step (never more than one)
- Keep responses SHORT (2-3 sentences max)
- In steps 3 and 4: use gentle, human feeling labels (not therapy-speak)
- In step 5: no analysis, just space

CRITICAL: Never ask more than ONE question per response. Always follow the Validation → Affirmation → Question order.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: "gpt-4o", messages }),
    });

    if (!response.ok) {
      throw new Error(`AI response failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return Response.json({ message: aiMessage, nextStage: promptStage + 1 });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return Response.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
