import AsyncStorage from "@react-native-async-storage/async-storage";

const JOURNAL_STORAGE_KEY = "@journal_entries";

/**
 * Save journal content and audio to device storage
 * @param {string} entryId - The ID of the journal entry from the backend
 * @param {Object} data - { conversationHistory, audioUrls }
 */
export async function saveJournalLocally(entryId, data) {
  try {
    const existingData = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    const entries = existingData ? JSON.parse(existingData) : {};

    entries[entryId] = {
      conversationHistory: data.conversationHistory || [],
      audioUrls: data.audioUrls || [],
      savedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("Error saving journal locally:", error);
    return false;
  }
}

/**
 * Get journal content from device storage
 * @param {string} entryId - The ID of the journal entry
 * @returns {Object|null} - { conversationHistory, audioUrls } or null if not found
 */
export async function getJournalLocally(entryId) {
  try {
    const existingData = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existingData) return null;

    const entries = JSON.parse(existingData);
    return entries[entryId] || null;
  } catch (error) {
    console.error("Error getting journal locally:", error);
    return null;
  }
}

/**
 * Delete journal content from device storage
 * @param {string} entryId - The ID of the journal entry
 */
export async function deleteJournalLocally(entryId) {
  try {
    const existingData = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existingData) return true;

    const entries = JSON.parse(existingData);
    delete entries[entryId];

    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("Error deleting journal locally:", error);
    return false;
  }
}

/**
 * Clear all local journal data (use with caution)
 */
export async function clearAllJournals() {
  try {
    await AsyncStorage.removeItem(JOURNAL_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing all journals:", error);
    return false;
  }
}
