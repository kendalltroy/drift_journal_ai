import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function POST(request) {
  const limited = rateLimit(request, { key: "transcribe" });
  if (limited) return limited;
  try {
    const user = await getAuthUser(request);
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const audioBuffer = await file.arrayBuffer();
    const whisperForm = new FormData();
    whisperForm.append("file", new Blob([audioBuffer]), file.name || "audio.m4a");
    whisperForm.append("model", "whisper-1");

    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: whisperForm,
      },
    );

    if (!whisperResponse.ok) {
      console.error("Whisper API error:", await whisperResponse.text());
      throw new Error("Failed to transcribe audio");
    }

    const { text } = await whisperResponse.json();
    return Response.json({ transcription: text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return Response.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}

export const action = ({ request }) => POST(request);
