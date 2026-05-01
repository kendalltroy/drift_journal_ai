import { supabase } from "@/app/api/utils/supabase";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function GET(request) {
  const limited = rateLimit(request, { key: "journal" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, ai_prompts")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching entries:", error);
    return Response.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request) {
  const limited = rateLimit(request, { key: "journal" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emotion, mode, content, prompt, conversationHistory = [] } = body;

    let structuredContent = "";
    let aiPrompts = [];

    if (conversationHistory.length > 0) {
      let entryNum = 1;
      conversationHistory.forEach((msg) => {
        if (msg.role === "assistant") {
          aiPrompts.push(msg.content);
        } else if (msg.role === "user") {
          structuredContent += `Entry ${entryNum}: ${msg.content}\n`;
          entryNum++;
        }
      });
    } else {
      structuredContent = `Entry 1: ${content}`;
      if (prompt) aiPrompts = [prompt];
    }

    const generatedAt = new Date().toISOString();
    let summary = "";
    let sentimentScore = 2;
    let tags = [];

    try {
      const [summaryResponse, analyticsResponse] = await Promise.all([
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a summarization expert. Generate a summary of exactly 5 words or fewer that captures the main theme or emotion of this journal entry. Be concise and specific. IMPORTANT: Never use clinical, crisis, or triggering language — no terms like 'suicidal', 'self-harm', 'eating disorder', 'overdose', 'cutting', or any specific mental health diagnosis. Instead use broad, gentle language like 'mental health', 'serious thoughts', 'difficult feelings', 'personal struggles'. Examples: 'Anxious about work presentation', 'Grateful for peaceful morning', 'Worried about family conflict', 'Processing some serious thoughts'.",
              },
              {
                role: "user",
                content: `Summarize this journal entry in exactly 5 words or fewer:\n\n${structuredContent}`,
              },
            ],
          }),
        }),
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
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
        if (words.length > 5) summary = words.slice(0, 5).join(" ");
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const aiResponse = analyticsData.choices[0].message.content.trim();
        try {
          const parsed = JSON.parse(aiResponse);
          const sentimentMap = { low: 1, medium: 2, high: 3 };
          sentimentScore = sentimentMap[parsed.sentiment_score] ?? 2;
          tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        } catch {
          // keep defaults
        }
      }
    } catch {
      summary = emotion ? `Feeling ${emotion.toLowerCase()}` : "Journal entry";
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        emotion,
        mode,
        prompt: aiPrompts[0] ?? null,
        summary,
        user_id: user.userId,
        sentiment_score: sentimentScore,
        tags,
        generated_at: generatedAt,
        ai_prompts: aiPrompts,
      })
      .select("id, emotion, mode, prompt, summary, sentiment_score, tags, created_at, generated_at, ai_prompts")
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    console.error("Error creating entry:", error);
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const limited = rateLimit(request, { key: "journal" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("user_id", user.userId);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting all entries:", error);
    return Response.json({ error: "Failed to delete entries" }, { status: 500 });
  }
}

export const loader = ({ request }) => GET(request);
export const action = ({ request }) => {
  if (request.method === 'DELETE') return DELETE(request);
  return POST(request);
};
