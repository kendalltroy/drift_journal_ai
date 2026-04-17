import { authFetch } from "./authFetch";
import { saveJournalLocally } from "./journalStorage";

export async function saveJournalEntry(data) {
  let response;
  try {
    response = await authFetch("/api/journal", {
      method: "POST",
      body: JSON.stringify({
        emotion: data.emotion,
        mode: data.mode,
        conversationHistory: data.conversationHistory,
      }),
    });
  } catch (fetchErr) {
    console.error("[saveJournalEntry] fetch threw:", fetchErr);
    throw new Error("Failed to save journal entry");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    console.error(`[saveJournalEntry] ${response.status} ${response.statusText}:`, body);
    throw new Error("Failed to save journal entry");
  }

  const savedEntry = await response.json();

  // Store conversation history locally — never sent to the server
  await saveJournalLocally(savedEntry.id.toString(), data.conversationHistory);

  return savedEntry;
}
