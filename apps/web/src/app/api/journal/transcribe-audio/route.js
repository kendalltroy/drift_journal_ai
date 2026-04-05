export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let audioBuffer;
    let filename = "audio.m4a";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
      }
      audioBuffer = await file.arrayBuffer();
      filename = file.name || filename;
    } else {
      const body = await request.json();
      const { audioUrl } = body;
      if (!audioUrl) {
        return Response.json({ error: "No audio URL provided" }, { status: 400 });
      }
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio file");
      }
      audioBuffer = await audioResponse.arrayBuffer();
    }

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer]), filename);
    formData.append("model", "whisper-1");

    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.text();
      console.error("Whisper API error:", errorData);
      throw new Error("Failed to transcribe audio");
    }

    const transcription = await whisperResponse.json();

    return Response.json({
      transcription: transcription.text,
    });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return Response.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
