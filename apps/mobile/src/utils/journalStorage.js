import AsyncStorage from "@react-native-async-storage/async-storage";

const JOURNAL_STORAGE_KEY = "@journal_entries";

export async function saveJournalLocally(entryId, conversationHistory) {
  try {
    const existing = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    const entries = existing ? JSON.parse(existing) : {};
    entries[entryId] = conversationHistory;
    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Error saving journal locally:", error);
  }
}

export async function getJournalLocally(entryId) {
  try {
    const existing = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existing) return null;
    const entries = JSON.parse(existing);
    return entries[entryId] ?? null;
  } catch (error) {
    console.error("Error getting journal locally:", error);
    return null;
  }
}

export async function deleteJournalLocally(entryId) {
  try {
    const existing = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existing) return;
    const entries = JSON.parse(existing);
    delete entries[entryId];
    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Error deleting journal locally:", error);
  }
}
