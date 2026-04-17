import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_PREFIX = "drift.nightly.reminder";
const REMINDER_COUNT = 7;

const NOTIFICATION_BODIES = [
  "Your space is ready — no rush, just here when you're ready 🌙",
  "Time to set your mind down for the night. Take your time 🌙",
  "You made it through today. Come offload before you sleep 🌙",
  "No pressure, just a gentle nudge — your thoughts are waiting to be released 🌙",
  "You're allowed to relax now. Let's close the day together 🌙",
];

function shuffledBodies(count) {
  // Fisher-Yates shuffle, then tile if count > pool size
  const shuffled = [...NOTIFICATION_BODIES].sort(() => Math.random() - 0.5);
  const result = [];
  while (result.length < count) {
    result.push(...shuffled);
  }
  return result.slice(0, count);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NotificationManager = {
  async requestPermission() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  },

  async scheduleNightlyReminder(time) {
    await this.cancelNightlyReminder();

    const granted = await this.requestPermission();
    if (!granted) {
      console.log("[Notifications] Permission denied — reminders not scheduled.");
      return false;
    }

    const now = new Date();
    const bodies = shuffledBodies(REMINDER_COUNT);

    for (let i = 0; i < REMINDER_COUNT; i++) {
      const trigger = new Date(now);
      trigger.setDate(trigger.getDate() + i + 1);
      trigger.setHours(time.getHours(), time.getMinutes(), 0, 0);

      if (i === 0) {
        const todayTrigger = new Date(now);
        todayTrigger.setHours(time.getHours(), time.getMinutes(), 0, 0);
        if (todayTrigger > now) {
          trigger.setDate(now.getDate());
          trigger.setHours(time.getHours(), time.getMinutes(), 0, 0);
        }
      }

      const body = bodies[i];
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}.${i}`,
        content: { title: "Drift", body },
        trigger: { type: "date", date: trigger },
      });

      console.log(`[Notifications] Scheduled #${i}: ${trigger.toDateString()} at ${trigger.toLocaleTimeString()} — "${body}"`);
    }

    console.log(`[Notifications] ✓ ${REMINDER_COUNT} reminders scheduled at ${time.getHours()}:${String(time.getMinutes()).padStart(2, "0")}`);
    return true;
  },

  async cancelNightlyReminder() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter((n) => n.identifier.startsWith(REMINDER_PREFIX));
    await Promise.all(
      ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
    if (ours.length > 0) {
      console.log(`[Notifications] Cancelled ${ours.length} existing reminders.`);
    }
  },

  async scheduleThoughtReminder(thought, date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn("[Notifications] scheduleThoughtReminder: invalid date, skipping.");
      return null;
    }
    if (date <= new Date()) {
      console.warn("[Notifications] scheduleThoughtReminder: date is in the past, skipping.");
      return null;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      console.log("[Notifications] Permission denied — thought reminder not scheduled.");
      return null;
    }

    const body = thought.length > 100 ? thought.slice(0, 100) + "…" : thought;
    const id = `drift.thought.${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title: "A thought you left for now 🌙", body },
      trigger: { type: "date", date },
    });

    console.log(`[Notifications] Thought reminder scheduled (${id}): "${body}" at ${date.toLocaleString()}`);
    return id;
  },

  async cancelThoughtReminder(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`[Notifications] Cancelled thought reminder: ${notificationId}`);
    } catch (e) {
      console.warn(`[Notifications] Could not cancel thought reminder ${notificationId}:`, e);
    }
  },
};

export default NotificationManager;
