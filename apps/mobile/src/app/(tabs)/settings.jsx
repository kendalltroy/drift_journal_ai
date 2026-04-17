import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Modal,
  Linking,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  Shield,
  CircleHelp,
  Info,
  Crown,
  ChevronRight,
  X,
  Mail,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import PremiumModal from "@/components/PremiumModal";
import { useAuth } from "@/utils/auth/useAuth";
import { useAuthStore } from "@/utils/auth/store";
import { authFetch } from "@/utils/authFetch";
import NotificationManager from "@/utils/notifications";

const SMART_REMINDERS_KEY = "drift_smart_reminders_enabled";
const REMINDER_TIME_KEY = "drift_reminder_time";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [showPremium, setShowPremium] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [smartReminders, setSmartReminders] = useState(true);
  const [reminderHour, setReminderHour] = useState(21); // default 9:00 PM
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingHour, setPendingHour] = useState(21);
  const [pendingMinute, setPendingMinute] = useState(0);

  useEffect(() => {
    AsyncStorage.multiGet([SMART_REMINDERS_KEY, REMINDER_TIME_KEY]).then(
      ([[, remVal], [, timeVal]]) => {
        if (remVal !== null) setSmartReminders(remVal === "true");
        if (timeVal !== null) {
          const { hour, minute } = JSON.parse(timeVal);
          setReminderHour(hour);
          setReminderMinute(minute);
        }
      }
    );
  }, []);

  const toggleSmartReminders = async (value) => {
    setSmartReminders(value);
    await AsyncStorage.setItem(SMART_REMINDERS_KEY, value.toString());
    if (value) {
      const time = new Date();
      time.setHours(reminderHour, reminderMinute, 0, 0);
      await NotificationManager.scheduleNightlyReminder(time);
    } else {
      await NotificationManager.cancelNightlyReminder();
    }
  };

  const saveReminderTime = async (hour, minute) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify({ hour, minute }));
    if (smartReminders) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      await NotificationManager.scheduleNightlyReminder(time);
    }
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const m = String(minute).padStart(2, "0");
    return `${h}:${m} ${period}`;
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeletingAccount(true);
    try {
      const response = await authFetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete account");
      // Account is deleted — close the modal, then clear local state directly.
      // Skip the Supabase network signOut since the account no longer exists.
      setShowDeleteAccount(false);
      setDeletingAccount(false);
      await AsyncStorage.clear();
      useAuthStore.getState().setAuth(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
      setDeletingAccount(false);
    }
  };

  const SmoothButton = ({ onPress, children, style }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            style,
            {
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    type = "link",
    onPress,
    onToggle,
    destructive = false,
  }) => (
    <SmoothButton
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#7e3f2d",
      }}
    >
      <View
        style={{
          backgroundColor: destructive ? "rgba(220, 38, 38, 0.15)" : "#7e3f2d",
          padding: 8,
          borderRadius: 8,
          marginRight: 16,
        }}
      >
        <Icon size={20} color={destructive ? "#ef4444" : "#f9a35e"} />
      </View>
      <Text
        style={{
          flex: 1,
          color: destructive ? "#ef4444" : "#ffefdd",
          fontSize: 16,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      {type === "link" && (
        <ChevronRight size={20} color={destructive ? "#ef4444" : "#7e3f2d"} />
      )}
      {type === "toggle" && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ true: "#f9a35e" }}
        />
      )}
    </SmoothButton>
  );

  const InfoModal = ({ visible, onClose, title, children }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#4e1709",
            borderRadius: 24,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            borderWidth: 2,
            borderColor: "#7e3f2d",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#f9a35e",
              }}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={24} color="#ffefdd" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#ffefdd",
            marginBottom: 32,
          }}
        >
          Settings
        </Text>

        <SmoothButton
          onPress={() => setShowPremium(true)}
          style={{
            backgroundColor: "#f9a35e",
            padding: 24,
            borderRadius: 20,
            marginBottom: 32,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                color: "#4e1709",
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 4,
              }}
            >
              Drift Plus
            </Text>
            <Text style={{ color: "#4e1709", opacity: 0.9, fontSize: 14 }}>
              Unlock all premium features
            </Text>
          </View>
          <Crown color="#4e1709" size={32} />
        </SmoothButton>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#7e3f2d",
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            General
          </Text>
          <SettingItem
            icon={Bell}
            label="Smart Reminders"
            type="toggle"
            value={smartReminders}
            onToggle={toggleSmartReminders}
          />
          {smartReminders && (
            <TouchableOpacity
              onPress={() => {
                setPendingHour(reminderHour);
                setPendingMinute(reminderMinute);
                setShowTimePicker(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingLeft: 52,
                borderBottomWidth: 1,
                borderBottomColor: "#7e3f2d",
              }}
            >
              <Text style={{ flex: 1, color: "#7e3f2d", fontSize: 14 }}>
                Reminder time
              </Text>
              <Text style={{ color: "#f9a35e", fontSize: 14, fontWeight: "600", marginRight: 8 }}>
                {formatTime(reminderHour, reminderMinute)}
              </Text>
              <ChevronRight size={16} color="#7e3f2d" />
            </TouchableOpacity>
          )}
          <SettingItem
            icon={Shield}
            label="Privacy & Security"
            onPress={() => router.push("/privacy")}
          />
          <SettingItem
            icon={Sparkles}
            label="Personalization"
            onPress={() => router.push("/personalization")}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#7e3f2d",
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Support
          </Text>
          <SettingItem
            icon={CircleHelp}
            label="Help Center"
            onPress={() => setShowHelpCenter(true)}
          />
          <SettingItem
            icon={Info}
            label="About Drift"
            onPress={() => setShowAbout(true)}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              color: "#7e3f2d",
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Account
          </Text>
          <SettingItem
            icon={Trash2}
            label="Delete Account"
            onPress={() => {
              setDeleteConfirmText("");
              setShowDeleteAccount(true);
            }}
            destructive
          />
        </View>

        <PremiumModal
          visible={showPremium}
          onClose={() => setShowPremium(false)}
        />

        {/* Help Center Modal */}
        <InfoModal
          visible={showHelpCenter}
          onClose={() => setShowHelpCenter(false)}
          title="Help Center"
        >
          <Text
            style={{
              color: "#ffefdd",
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            Need help? We're here for you.{"\n\n"}
            Send us an email and we'll get back to you as soon as possible.
          </Text>

          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:driftjournal8@gmail.com")}
            style={{
              backgroundColor: "#f9a35e",
              padding: 16,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mail size={20} color="#4e1709" style={{ marginRight: 8 }} />
            <Text
              style={{
                color: "#4e1709",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              driftjournal8@gmail.com
            </Text>
          </TouchableOpacity>
        </InfoModal>

        {/* About Drift Modal */}
        <InfoModal
          visible={showAbout}
          onClose={() => setShowAbout(false)}
          title="About Drift"
        >
          <Text
            style={{
              color: "#ffefdd",
              fontSize: 16,
              lineHeight: 26,
              marginBottom: 16,
            }}
          >
            Drift is your peaceful companion for nighttime reflection. We
            believe journaling should feel like a conversation with a trusted
            friend, not a chore.
          </Text>

          <Text
            style={{
              color: "#ffefdd",
              fontSize: 16,
              lineHeight: 26,
              marginBottom: 16,
            }}
          >
            Through gentle AI-guided prompts, we help you process your day, find
            gratitude, and drift into restful sleep with a clear mind.
          </Text>

          <Text
            style={{
              color: "#7e3f2d",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Version 1.0.0
          </Text>
        </InfoModal>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#4e1709",
                borderRadius: 24,
                padding: 24,
                width: "100%",
                maxWidth: 400,
                borderWidth: 2,
                borderColor: "#7e3f2d",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#f9a35e" }}>
                  Reminder Time
                </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)} style={{ padding: 4 }}>
                  <X size={24} color="#ffefdd" />
                </TouchableOpacity>
              </View>

              {/* Time picker */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
                {/* Hour */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: "#7e3f2d", fontSize: 10, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Hour</Text>
                  <Text style={{ color: "#ffefdd", fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
                    {pendingHour % 12 === 0 ? 12 : pendingHour % 12}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4, alignSelf: "stretch" }}>
                    <TouchableOpacity
                      onPress={() => setPendingHour((h) => (h === 0 ? 23 : h - 1))}
                      style={{ flex: 1, backgroundColor: "#7e3f2d", borderRadius: 8, paddingVertical: 6, alignItems: "center" }}
                    >
                      <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPendingHour((h) => (h === 23 ? 0 : h + 1))}
                      style={{ flex: 1, backgroundColor: "#7e3f2d", borderRadius: 8, paddingVertical: 6, alignItems: "center" }}
                    >
                      <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: "#ffefdd", fontSize: 28, fontWeight: "700", marginBottom: 30 }}>:</Text>

                {/* Minute */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: "#7e3f2d", fontSize: 10, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Min</Text>
                  <Text style={{ color: "#ffefdd", fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
                    {String(pendingMinute).padStart(2, "0")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4, alignSelf: "stretch" }}>
                    <TouchableOpacity
                      onPress={() => setPendingMinute((m) => (m === 0 ? 55 : m - 5))}
                      style={{ flex: 1, backgroundColor: "#7e3f2d", borderRadius: 8, paddingVertical: 6, alignItems: "center" }}
                    >
                      <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPendingMinute((m) => (m === 55 ? 0 : m + 5))}
                      style={{ flex: 1, backgroundColor: "#7e3f2d", borderRadius: 8, paddingVertical: 6, alignItems: "center" }}
                    >
                      <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* AM/PM */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: "#7e3f2d", fontSize: 10, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Period</Text>
                  <TouchableOpacity
                    onPress={() => setPendingHour((h) => (h >= 12 ? h - 12 : h + 12))}
                    style={{ backgroundColor: "#7e3f2d", borderRadius: 8, paddingVertical: 10, alignSelf: "stretch", alignItems: "center", marginTop: 20 }}
                  >
                    <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700" }}>
                      {pendingHour >= 12 ? "PM" : "AM"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  saveReminderTime(pendingHour, pendingMinute);
                  setShowTimePicker(false);
                }}
                style={{
                  backgroundColor: "#f9a35e",
                  padding: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#4e1709", fontSize: 16, fontWeight: "700" }}>
                  Set Reminder — {formatTime(pendingHour, pendingMinute)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteAccount}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteAccount(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#4e1709",
                borderRadius: 24,
                padding: 24,
                width: "100%",
                maxWidth: 400,
                borderWidth: 2,
                borderColor: "#ef4444",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 22, fontWeight: "700", color: "#ef4444" }}
                >
                  Delete Account
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDeleteAccount(false)}
                  style={{ padding: 4 }}
                >
                  <X size={24} color="#ffefdd" />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 15,
                  lineHeight: 22,
                  marginBottom: 8,
                }}
              >
                This will permanently delete your account and erase all your data, including:
              </Text>
              <Text
                style={{
                  color: "#7e3f2d",
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 20,
                }}
              >
                • All journal entries{"\n"}
                • All tasks{"\n"}
                • Your account and login
              </Text>

              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                Type{" "}
                <Text style={{ fontWeight: "700", color: "#ef4444" }}>
                  DELETE
                </Text>{" "}
                to confirm.
              </Text>

              <TextInput
                value={deleteConfirmText}
                onChangeText={(t) => setDeleteConfirmText(t.trim().toUpperCase())}
                placeholder="Type DELETE"
                placeholderTextColor="#7e3f2d"
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
                style={{
                  backgroundColor: "#3a1006",
                  borderWidth: 1,
                  borderColor:
                    deleteConfirmText === "DELETE" ? "#ef4444" : "#7e3f2d",
                  borderRadius: 12,
                  padding: 14,
                  color: "#ffefdd",
                  fontSize: 16,
                  marginBottom: 20,
                }}
              />

              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  backgroundColor:
                    deleteConfirmText === "DELETE" ? "#ef4444" : "#7e3f2d",
                  padding: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity:
                    deleteConfirmText !== "DELETE" || deletingAccount ? 0.5 : 1,
                }}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Permanently Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <SmoothButton
          onPress={signOut}
          style={{ alignItems: "center", padding: 16 }}
        >
          <Text style={{ color: "#f9a35e", fontWeight: "600" }}>Log Out</Text>
        </SmoothButton>

        <Text
          style={{
            textAlign: "center",
            color: "#7e3f2d",
            fontSize: 12,
            marginTop: 16,
          }}
        >
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
