import { useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationManager from "@/utils/notifications";

export const ONBOARDING_SHOWN_KEY = "drift_onboarding_shown";
const SMART_REMINDERS_KEY = "drift_smart_reminders_enabled";
const REMINDER_TIME_KEY = "drift_reminder_time";

function formatTime(hour, minute) {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${period}`;
}

export default function ReminderOnboardingModal({ visible, onDismiss }) {
  const [pendingHour, setPendingHour] = useState(21);
  const [pendingMinute, setPendingMinute] = useState(0);

  const markShown = () =>
    AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, "true");

  const handleSetReminder = async () => {
    await AsyncStorage.multiSet([
      [SMART_REMINDERS_KEY, "true"],
      [REMINDER_TIME_KEY, JSON.stringify({ hour: pendingHour, minute: pendingMinute })],
    ]);
    const time = new Date();
    time.setHours(pendingHour, pendingMinute, 0, 0);
    await NotificationManager.scheduleNightlyReminder(time);
    await markShown();
    onDismiss();
  };

  const handleSkip = async () => {
    await AsyncStorage.multiSet([
      [SMART_REMINDERS_KEY, "false"],
    ]);
    await NotificationManager.cancelNightlyReminder();
    await markShown();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#4e1709",
            borderRadius: 24,
            padding: 28,
            width: "100%",
            maxWidth: 400,
            borderWidth: 2,
            borderColor: "#7e3f2d",
          }}
        >
          {/* Header */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#f9a35e",
              marginBottom: 12,
              lineHeight: 28,
            }}
          >
            Let your mind slow down before sleep
          </Text>

          {/* Body */}
          <Text
            style={{
              fontSize: 15,
              color: "#ffefdd",
              lineHeight: 22,
              marginBottom: 24,
              opacity: 0.85,
            }}
          >
            If your thoughts tend to race at night, a small habit can help.{"\n"}
            Set a reminder to journal and unwind.
          </Text>

          {/* Prompt */}
          <Text
            style={{
              fontSize: 14,
              color: "#7e3f2d",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            What time feels right for you?
          </Text>

          {/* Time Picker */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 28,
            }}
          >
            {/* Hour */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text
                style={{
                  color: "#7e3f2d",
                  fontSize: 10,
                  fontWeight: "600",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Hour
              </Text>
              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 28,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {pendingHour % 12 === 0 ? 12 : pendingHour % 12}
              </Text>
              <View style={{ flexDirection: "row", gap: 4, alignSelf: "stretch" }}>
                <TouchableOpacity
                  onPress={() => setPendingHour((h) => (h === 0 ? 23 : h - 1))}
                  style={{
                    flex: 1,
                    backgroundColor: "#7e3f2d",
                    borderRadius: 8,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPendingHour((h) => (h === 23 ? 0 : h + 1))}
                  style={{
                    flex: 1,
                    backgroundColor: "#7e3f2d",
                    borderRadius: 8,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text
              style={{ color: "#ffefdd", fontSize: 28, fontWeight: "700", marginBottom: 30 }}
            >
              :
            </Text>

            {/* Minute */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text
                style={{
                  color: "#7e3f2d",
                  fontSize: 10,
                  fontWeight: "600",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Min
              </Text>
              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 28,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {String(pendingMinute).padStart(2, "0")}
              </Text>
              <View style={{ flexDirection: "row", gap: 4, alignSelf: "stretch" }}>
                <TouchableOpacity
                  onPress={() => setPendingMinute((m) => (m === 0 ? 55 : m - 5))}
                  style={{
                    flex: 1,
                    backgroundColor: "#7e3f2d",
                    borderRadius: 8,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPendingMinute((m) => (m === 55 ? 0 : m + 5))}
                  style={{
                    flex: 1,
                    backgroundColor: "#7e3f2d",
                    borderRadius: 8,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* AM/PM */}
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text
                style={{
                  color: "#7e3f2d",
                  fontSize: 10,
                  fontWeight: "600",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Period
              </Text>
              <TouchableOpacity
                onPress={() => setPendingHour((h) => (h >= 12 ? h - 12 : h + 12))}
                style={{
                  backgroundColor: "#7e3f2d",
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignSelf: "stretch",
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700" }}>
                  {pendingHour >= 12 ? "PM" : "AM"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Set Reminder button */}
          <TouchableOpacity
            onPress={handleSetReminder}
            style={{
              backgroundColor: "#f9a35e",
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ color: "#4e1709", fontSize: 16, fontWeight: "700" }}>
              Set Reminder — {formatTime(pendingHour, pendingMinute)}
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity onPress={handleSkip} style={{ alignItems: "center", paddingVertical: 4 }}>
            <Text style={{ color: "#7e3f2d", fontSize: 14 }}>
              No reminders for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
