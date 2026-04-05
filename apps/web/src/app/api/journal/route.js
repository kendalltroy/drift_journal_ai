import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/getAuthUser";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await sql`
      SELECT id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, ai_prompts
      FROM journal_entries
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `;
    return Response.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    return Response.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      emotion,
      mode,
      content,
      prompt,
      audioUrls = [],
      conversationHistory = [],
    } = body;

    // Extract AI prompts and user content separately
    let structuredContent = "";
    let aiPrompts = []; // Array of AI prompts shown to user

    if (conversationHistory && conversationHistory.length > 0) {
      let entryNum = 1;

      conversationHistory.forEach((msg) => {
        if (msg.role === "assistant") {
          // Collect AI prompts
          aiPrompts.push(msg.content);
        } else if (msg.role === "user") {
          structuredContent += `Entry ${entryNum}: ${msg.content}\n`;
          entryNum++;
        }
      });
    } else {
      // Fallback for simple entries
      structuredContent = `Entry 1: ${content}`;
      if (prompt) {
        aiPrompts = [prompt];
      }
    }

    // Generate AI analysis in parallel
    const generatedAt = new Date().toISOString();
    let summary = "";
    let sentimentScore = 2;
    let tags = [];

    try {
      const [summaryResponse, analyticsResponse] = await Promise.all([
        // Generate 5-word summary
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a summarization expert. Generate a summary of exactly 5 words or fewer that captures the main theme or emotion of this journal entry. Be concise and specific. Examples: 'Anxious about work presentation', 'Grateful for peaceful morning', 'Worried about family conflict'.",
              },
              {
                role: "user",
                content: `Summarize this journal entry in exactly 5 words or fewer:\n\n${structuredContent}`,
              },
            ],
          }),
        }),
        // Generate sentiment score and tags
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an emotional intelligence expert. Analyze the journal entry and return a JSON object with:
1. "sentiment_score": Rate emotional intensity as "low" (calm, peaceful), "medium" (moderate emotion), or "high" (intense emotion, distress)
2. "tags": Array of 1-5 tags from this list that best match the entry themes: work, relationships, health, future, self-worth, uncertainty, family, finance, sleep, identity

Return ONLY valid JSON in this format: {"sentiment_score": "medium", "tags": ["work", "uncertainty"]}`,
              },
              {
                role: "user",
                content: `Analyze this journal entry:\n\n${structuredContent}`,
              },
            ],
          }),
        }),
      ]);

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summary = summaryData.choices[0].message.content.trim();
        const words = summary.split(/\s+/);
        if (words.length > 5) {
          summary = words.slice(0, 5).join(" ");
        }
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const aiResponse = analyticsData.choices[0].message.content.trim();
        try {
          const parsed = JSON.parse(aiResponse);
          const sentimentMap = { low: 1, medium: 2, high: 3 };
          sentimentScore = sentimentMap[parsed.sentiment_score] ?? 2;
          tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        } catch (parseError) {
          console.error("Failed to parse AI analytics response:", parseError);
        }
      }
    } catch (error) {
      console.error("Failed to generate AI analysis:", error);
      summary = emotion ? `Feeling ${emotion.toLowerCase()}` : "Journal entry";
    }

    // Save to database (content and audio stay on device only, AI prompts saved to ai_prompts array)
    const [newEntry] = await sql`
      INSERT INTO journal_entries (
        emotion, 
        mode, 
        prompt, 
        summary, 
        user_id, 
        sentiment_score, 
        tags, 
        generated_at,
        ai_prompts
      )
      VALUES (
        ${emotion}, 
        ${mode}, 
        ${aiPrompts.length > 0 ? aiPrompts[0] : null}, 
        ${summary}, 
        ${user.userId},
        ${sentimentScore}, 
        ${tags}, 
        ${generatedAt},
        ${aiPrompts}
      )
      RETURNING id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, ai_prompts
    `;

    return Response.json(newEntry);
  } catch (error) {
    console.error("Error creating entry:", error);
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sql`DELETE FROM journal_entries WHERE user_id = ${user.userId}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting all entries:", error);
    return Response.json({ error: "Failed to delete entries" }, { status: 500 });
  }
}

