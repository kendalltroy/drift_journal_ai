import { saveJournalLocally } from "./journalStorage";
import { authFetch } from "./authFetch";

/**
 * Save journal entry to backend and local storage
 * @param {Object} data - { emotion, mode, conversationHistory }
 * @param {Array} audioMemos - Array of audio URL strings
 * @returns {Promise<Object>} - Saved entry from backend
 */
export async function saveJournalEntry(data, audioMemos = []) {
  const response = await authFetch("/api/journal", {
    method: "POST",
    body: JSON.stringify({
      emotion: data.emotion,
      mode: data.mode,
      conversationHistory: data.conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save journal entry");
  }

  const savedEntry = await response.json();

  // Save content and audio locally on device (privacy-first)
  await saveJournalLocally(savedEntry.id.toString(), {
    conversationHistory: data.conversationHistory,
    audioUrls: audioMemos,
  });

  return savedEntry;
}
