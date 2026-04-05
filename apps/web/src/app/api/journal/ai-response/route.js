import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userMessage,
      emotion,
      conversationHistory = [],
      promptStage = 1,
      personalized = true,
    } = body;

    // Fetch previous journal entries from the past 7 days (summaries only) if personalization is enabled
    let entryContext = "";
    if (personalized) {
      const previousEntries = await sql`
        SELECT emotion, summary, created_at
        FROM journal_entries
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 5
      `;

      if (previousEntries.length > 0) {
        entryContext = "\n\nPrevious entries (past 7 days):\n";
        previousEntries.forEach((entry, index) => {
          const date = new Date(entry.created_at).toLocaleDateString();
          entryContext += `${index + 1}. ${date} - ${entry.emotion}: ${entry.summary}\n`;
        });
        entryContext += "\nPersonalize prompts using these patterns.";
      }
    }

    // Define the 5-step journaling sequence
    const promptPatterns = {
      1: {
        purpose:
          "Gratitude - help them slow down and notice something positive",
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
        purpose: "Brain Dump #1 - release what's on their mind",
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
        purpose: "Brain Dump #2 - name the feeling gently",
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
        purpose: "Brain Dump #3 - close with one final reflective question",
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
        purpose: "Any Last Thoughts - open space with no pressure",
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

${currentPrompt.instruction}

Core tone rules:
- Calm, slow, warm — never rushed or clinical
- Use phrases like "Take your time", "You're allowed to rest", "It's okay", "I hear you"
- Validate every response warmly
- Include a gentle affirmation in each response
- Ask ONLY ONE question per step (never more than one)
- Keep responses SHORT (2-3 sentences max)
- In steps 3 and 4: use gentle, human feeling labels (not therapy-speak)
- In step 5: no analysis, just space

CRITICAL: Never ask more than ONE question per response. One question only.`;

    // Build messages array with conversation history
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return Response.json({ message: aiMessage, nextStage: promptStage + 1 });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
