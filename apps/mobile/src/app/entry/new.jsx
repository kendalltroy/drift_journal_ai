import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  X,
  Send,
  Mic,
  Check,
  MessageCircle,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import { format, addDays } from "date-fns";
import Owl from "@/components/Owl";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import PremiumModal from "@/components/PremiumModal";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import { saveJournalEntry } from "@/utils/saveJournalEntry";
import { authFetch } from "@/utils/authFetch";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationManager from "@/utils/notifications";
import { PERSONALIZATION_KEY } from "@/app/personalization";

export default function NewEntryScreen() {
  const { emotion } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const queryClient = useQueryClient();
  const [step, setStep] = useState("mode");
  const [mode, setMode] = useState(null);
  const [content, setContent] = useState("");
  const [gratitudeContent, setGratitudeContent] = useState("");
  const [brainDump1Content, setBrainDump1Content] = useState("");
  const [brainDump2Content, setBrainDump2Content] = useState("");
  const [brainDump3Content, setBrainDump3Content] = useState("");
  const [lastThoughtsContent, setLastThoughtsContent] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [reminderTasks, setReminderTasks] = useState("");
  const [currentAiPrompt, setCurrentAiPrompt] = useState("");
  const [promptStage, setPromptStage] = useState(1);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Date/time picker state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: 9, minute: 0 });

  // Audio recording
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      }
    })();
  }, []);

  // Add pulse animation effect when recording
  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [recorderState.isRecording]);

  const transitionToStep = (nextStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setStep(nextStep), 600);
  };

  // Fetch initial AI prompt when entering guided flow
  useEffect(() => {
    if (step === "gratitude" && mode === "guided" && !currentAiPrompt) {
      fetchAiPrompt("I'm ready to journal", 1);
    }
  }, [step, mode]);

  const fetchAiPrompt = async (
    userMessage,
    stage = promptStage,
    history = conversationHistory,
  ) => {
    setIsLoadingAi(true);
    try {
      const personalizationVal = await AsyncStorage.getItem(PERSONALIZATION_KEY);
      const personalized = personalizationVal === null ? true : personalizationVal === "true";

      const response = await authFetch("/api/journal/ai-response", {
        method: "POST",
        body: JSON.stringify({
          userMessage,
          emotion: emotion?.toLowerCase() || "anxious",
          promptStage: stage,
          conversationHistory: history,
          personalized,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.crisis) {
          setShowCrisisModal(true);
          return;
        }
        setCurrentAiPrompt(data.message);
        setPromptStage(data.nextStage || stage + 1);
      } else {
        setCurrentAiPrompt(getFallbackPrompt(stage));
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setCurrentAiPrompt(getFallbackPrompt(stage));
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getFallbackPrompt = (stage) => {
    if (stage === 1)
      return "What's something from today that you're grateful for?";
    if (stage === 2) return "What's been on your mind tonight?";
    if (stage === 3) return "How does that feel in your body right now?";
    if (stage === 4)
      return "Is there anything else from today that needs to be said?";
    if (stage === 5)
      return "If there's anything else still on your mind, you can share it. No pressure.";
    return "What else would you like to share?";
  };

  const handleNextStep = async () => {
    if (!content.trim()) return;

    const userResponse = content;

    // Update conversation history
    const newHistory = [
      ...conversationHistory,
      { role: "assistant", content: currentAiPrompt },
      { role: "user", content: userResponse },
    ];
    setConversationHistory(newHistory);

    if (step === "gratitude") {
      setGratitudeContent(userResponse);
      setContent("");
      transitionToStep("brain_dump_1");
      await fetchAiPrompt(userResponse, 2, newHistory);
    } else if (step === "brain_dump_1") {
      setBrainDump1Content(userResponse);
      setContent("");
      transitionToStep("brain_dump_2");
      await fetchAiPrompt(userResponse, 3, newHistory);
    } else if (step === "brain_dump_2") {
      setBrainDump2Content(userResponse);
      setContent("");
      transitionToStep("brain_dump_3");
      await fetchAiPrompt(userResponse, 4, newHistory);
    } else if (step === "brain_dump_3") {
      setBrainDump3Content(userResponse);
      setContent("");
      transitionToStep("last_thoughts");
      await fetchAiPrompt(userResponse, 5, newHistory);
    } else if (step === "last_thoughts") {
      setLastThoughtsContent(userResponse);
      setContent("");
      transitionToStep("complete");
    } else if (step === "continue") {
      setContent("");
      await fetchAiPrompt(userResponse, promptStage, newHistory);
    }
  };

  const handleContinue = async () => {
    const lastMessage =
      lastThoughtsContent ||
      brainDump3Content ||
      brainDump2Content ||
      brainDump1Content ||
      gratitudeContent;
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: lastMessage },
    ];
    setConversationHistory(newHistory);

    transitionToStep("continue");
    await fetchAiPrompt(lastMessage, promptStage, newHistory);
  };

  const handleCloseJournal = () => {
    transitionToStep("reminder");
  };

  const handleSkipReminder = () => {
    transitionToStep("closing");
  };

  const handleContinueFromReminder = () => {
    setReminderTasks(content);
    transitionToStep("reminder_time");
  };

  const handleSaveReminderWithTime = async () => {
    if (!selectedDate) {
      // If no date selected, just save without scheduling
      transitionToStep("closing");
      return;
    }

    try {
      // Combine selected date and time into ISO timestamp.
      // Parse as local date (not UTC) to avoid timezone day-shift.
      const [y, m, d] = selectedDate.split("-").map(Number);
      const scheduledDateTime = new Date(y, m - 1, d, selectedTime.hour, selectedTime.minute, 0, 0);

      // Save task to backend with scheduled time
      const response = await authFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          content: reminderTasks,
          scheduled_time: scheduledDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save reminder");
      }

      const task = await response.json();

      // Schedule local notification for the thought
      const notifId = await NotificationManager.scheduleThoughtReminder(reminderTasks, scheduledDateTime);

      // Persist the notification identifier locally, keyed by task ID
      if (notifId && task?.id) {
        const stored = await AsyncStorage.getItem("drift_thought_notif_ids");
        const map = stored ? JSON.parse(stored) : {};
        map[task.id] = notifId;
        await AsyncStorage.setItem("drift_thought_notif_ids", JSON.stringify(map));
      }

      setContent("");
      transitionToStep("closing");
    } catch (error) {
      console.error("Error saving reminder:", error);
      // Continue anyway - better UX than blocking
      transitionToStep("closing");
    }
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      await saveJournalEntry({ emotion, mode, conversationHistory });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      router.back();
    } catch (error) {
      console.error("Failed to save entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueJournal = async () => {
    // If in brain dump mode at journaling step, go to choice screen
    if (step === "journaling" && mode === "brain_dump") {
      if (content.trim()) {
        setBrainDump1Content(content);
        const newHistory = [
          ...conversationHistory,
          { role: "user", content: content },
        ];
        setConversationHistory(newHistory);
      }
      setContent("");
      transitionToStep("brain_dump_choice");
    } else {
      await handleNextStep();
    }
  };

  const handleStartGuidedFromBrainDump = () => {
    setMode("guided");
    setPromptStage(1);
    transitionToStep("gratitude");
    fetchAiPrompt("I'm ready to continue with guided journaling", 1);
  };

  const handleCloseJournalNow = () => {
    if (content.trim()) {
      if (step === "gratitude") {
        setGratitudeContent(content);
      } else if (step === "brain_dump_1") {
        setBrainDump1Content(content);
      } else if (step === "brain_dump_2") {
        setBrainDump2Content(content);
      } else if (step === "brain_dump_3") {
        setBrainDump3Content(content);
      } else if (step === "last_thoughts") {
        setLastThoughtsContent(content);
      }

      const newHistory = [
        ...conversationHistory,
        { role: "assistant", content: currentAiPrompt },
        { role: "user", content: content },
      ];
      setConversationHistory(newHistory);
    }

    setContent("");
    transitionToStep("reminder");
  };

  const handleVoiceMemo = async () => {
    if (recorderState.isRecording) {
      await recorder.stop();

      if (!recorder.uri) {
        console.error("No recording URI available");
        return;
      }

      try {
        setIsTranscribing(true);

        const fileResponse = await fetch(recorder.uri);
        const audioBlob = await fileResponse.blob();
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.m4a");

        const transcribeResponse = await authFetch(
          "/api/journal/transcribe-audio",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!transcribeResponse.ok) {
          throw new Error("Failed to transcribe audio");
        }

        const { transcription } = await transcribeResponse.json();

        setContent(transcription);
        setIsTranscribing(false);

        setTimeout(() => {
          handleNextStep();
        }, 300);
      } catch (error) {
        console.error("Error processing voice memo:", error);
        setIsTranscribing(false);
      }
    } else {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentPrompt = () => {
    if (
      step === "gratitude" ||
      step === "brain_dump_1" ||
      step === "brain_dump_2" ||
      step === "brain_dump_3" ||
      step === "last_thoughts" ||
      step === "continue"
    ) {
      return currentAiPrompt || "Take your time...";
    }
    if (mode === "brain_dump") {
      return "The floor is yours. Write down anything weighing on you.";
    }
    return "";
  };

  const getCurrentStepNumber = () => {
    if (step === "gratitude") return 1;
    if (step === "brain_dump_1") return 2;
    if (step === "brain_dump_2") return 3;
    if (step === "brain_dump_3") return 4;
    if (step === "last_thoughts") return 5;
    return 0;
  };

  // Progress dots component
  const ProgressDots = () => {
    const currentStep = getCurrentStepNumber();
    if (currentStep === 0) return null;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4, 5].map((dotNum) => (
          <View
            key={dotNum}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotNum <= currentStep ? "#f9a35e" : "#7e3f2d",
            }}
          />
        ))}
      </View>
    );
  };

  // Smooth button component with gentle press feedback
  const SmoothButton = ({ onPress, disabled, children, style, textStyle }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.95,
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
        disabled={disabled}
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

  // Helpers for 12-hour display
  const to12Hour = (hour24) => {
    const period = hour24 < 12 ? "AM" : "PM";
    const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return { hour12: h, period };
  };

  const to24Hour = (hour12, period) => {
    if (period === "AM") return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
  };

  const formatTime12 = (hour24, minute) => {
    const { hour12, period } = to12Hour(hour24);
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Time picker — text input fields for hour and minute
  const TimePickerButtons = () => {
    const { hour12: currentHour12, period: currentPeriod } = to12Hour(selectedTime.hour);
    const [hourText, setHourText] = useState(currentHour12.toString());
    const [minuteText, setMinuteText] = useState(selectedTime.minute.toString().padStart(2, "0"));

    const commitHour = (text) => {
      const val = parseInt(text, 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        setSelectedTime({ ...selectedTime, hour: to24Hour(val, currentPeriod) });
        setHourText(val.toString());
      } else {
        setHourText(currentHour12.toString());
      }
    };

    const commitMinute = (text) => {
      const val = parseInt(text, 10);
      if (!isNaN(val) && val >= 0 && val <= 59) {
        setSelectedTime({ ...selectedTime, minute: val });
        setMinuteText(val.toString().padStart(2, "0"));
      } else {
        setMinuteText(selectedTime.minute.toString().padStart(2, "0"));
      }
    };

    return (
      <View>
        {/* Time Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 24,
            backgroundColor: "#7e3f2d",
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#f9a35e",
            marginBottom: 24,
          }}
        >
          <Clock color="#f9a35e" size={28} />
          <TextInput
            value={hourText}
            onChangeText={setHourText}
            onBlur={() => commitHour(hourText)}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={{
              color: "#ffefdd",
              fontSize: 48,
              fontWeight: "700",
              letterSpacing: 2,
              textAlign: "center",
              width: 72,
              backgroundColor: "transparent",
            }}
          />
          <Text style={{ color: "#ffefdd", fontSize: 48, fontWeight: "700" }}>:</Text>
          <TextInput
            value={minuteText}
            onChangeText={setMinuteText}
            onBlur={() => commitMinute(minuteText)}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={{
              color: "#ffefdd",
              fontSize: 48,
              fontWeight: "700",
              letterSpacing: 2,
              textAlign: "center",
              width: 72,
              backgroundColor: "transparent",
            }}
          />
          <Text style={{ color: "#f9a35e", fontSize: 24, fontWeight: "700" }}>
            {currentPeriod}
          </Text>
        </View>

        {/* AM/PM Toggle */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {["AM", "PM"].map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedTime({ ...selectedTime, hour: to24Hour(currentHour12, period) })}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: currentPeriod === period ? "#f9a35e" : "#7e3f2d",
                borderWidth: 1,
                borderColor: "#f9a35e",
                alignItems: "center",
              }}
            >
              <Text style={{ color: currentPeriod === period ? "#4e1709" : "#ffefdd", fontSize: 18, fontWeight: "700" }}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Time Presets */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: "#7e3f2d", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Quick Presets
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Morning (9:00 AM)", hour: 9, minute: 0 },
              { label: "Noon (12:00 PM)", hour: 12, minute: 0 },
              { label: "Evening (6:00 PM)", hour: 18, minute: 0 },
              { label: "Night (9:00 PM)", hour: 21, minute: 0 },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.label}
                onPress={() => setSelectedTime({ hour: preset.hour, minute: preset.minute })}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: "#7e3f2d",
                  borderWidth: 1,
                  borderColor: "#f9a35e",
                }}
              >
                <Text style={{ color: "#ffefdd", fontSize: 14 }}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Date & Time Summary */}
        {selectedDate && (
          <View style={{ backgroundColor: "#f9a35e", padding: 16, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#4e1709", fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
              Reminder Set For:
            </Text>
            <Text style={{ color: "#4e1709", fontSize: 18, fontWeight: "700" }}>
              {format(new Date(selectedDate + 'T00:00:00'), "EEEE, MMMM d, yyyy")} at{" "}
              {formatTime12(selectedTime.hour, selectedTime.minute)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Get marked dates for calendar (next 30 days selectable)
  const getMarkedDates = () => {
    const today = new Date();
    const marked = {};

    // Mark today
    const todayStr = format(today, "yyyy-MM-dd");
    marked[todayStr] = {
      marked: true,
      dotColor: "#f9a35e",
      textColor: "#ffefdd",
    };

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: "#f9a35e",
        textColor: "#4e1709",
      };
    }

    return marked;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709" }}>
      {/* Crisis Modal */}
      <Modal
        visible={showCrisisModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
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
              borderWidth: 2,
              borderColor: "#f9a35e",
            }}
          >
            <Text
              style={{
                color: "#ffefdd",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              You're not alone
            </Text>
            <Text
              style={{
                color: "#ffefdd",
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              It sounds like you might be going through something really difficult right now. Please reach out — help is available right now, any time.
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL("tel:988")}
              style={{
                backgroundColor: "#f9a35e",
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#4e1709", fontSize: 16, fontWeight: "700" }}>
                Call 988 — Suicide & Crisis Lifeline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL("sms:741741?body=HOME")}
              style={{
                backgroundColor: "#7e3f2d",
                borderRadius: 14,
                padding: 16,
                marginBottom: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#f9a35e",
              }}
            >
              <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>
                Text HOME to 741741
              </Text>
              <Text style={{ color: "#7e3f2d", fontSize: 13, marginTop: 2 }}>
                Crisis Text Line
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                color: "#ffefdd",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Are you safe right now?
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowCrisisModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f9a35e",
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#4e1709", fontSize: 16, fontWeight: "700" }}>
                  Yes, I'm safe
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL("tel:988")}
                style={{
                  flex: 1,
                  backgroundColor: "#7e3f2d",
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#f9a35e",
                }}
              >
                <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700" }}>
                  I need help
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          zIndex: 10,
        }}
      >
        <SmoothButton onPress={() => router.back()} style={{ padding: 4 }}>
          <X color="#7e3f2d" size={28} />
        </SmoothButton>
        <Text style={{ color: "#ffefdd", fontSize: 18, fontWeight: "600" }}>
          {emotion} Night
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            paddingBottom: 120,
          }}
        >
          <Animated.View
            style={{ opacity: fadeAnim, alignItems: "center", marginTop: 20 }}
          >
            <Owl size={100} />

            {step === "mode" && (
              <View style={{ width: "100%", marginTop: 32 }}>
                <Text
                  style={{
                    color: "#ffefdd",
                    fontSize: 24,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  How would you like to reflect?
                </Text>
                <Text
                  style={{
                    color: "#7e3f2d",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 40,
                  }}
                >
                  Choose a style that feels right for you.
                </Text>

                <SmoothButton
                  onPress={() => {
                    setMode("guided");
                    transitionToStep("gratitude");
                  }}
                  style={{
                    backgroundColor: "#7e3f2d",
                    padding: 24,
                    borderRadius: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                  }}
                >
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 18,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    Guided Experience
                  </Text>
                  <Text style={{ color: "#ffefdd", fontSize: 14 }}>
                    I'll walk you through 5 steps to help you unwind.
                  </Text>
                </SmoothButton>

                <SmoothButton
                  onPress={() => {
                    setMode("brain_dump");
                    transitionToStep("journaling");
                  }}
                  style={{
                    backgroundColor: "#7e3f2d",
                    padding: 24,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                  }}
                >
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 18,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    Brain Dump
                  </Text>
                  <Text style={{ color: "#ffefdd", fontSize: 14 }}>
                    Just a quiet space to let everything out.
                  </Text>
                </SmoothButton>
              </View>
            )}

            {(step === "gratitude" ||
              step === "brain_dump_1" ||
              step === "brain_dump_2" ||
              step === "brain_dump_3" ||
              step === "last_thoughts" ||
              step === "continue") && (
              <View style={{ width: "100%", marginTop: 24 }}>
                {mode === "guided" && step !== "continue" && <ProgressDots />}

                {isLoadingAi || isTranscribing ? (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 60,
                    }}
                  >
                    <ActivityIndicator size="large" color="#f9a35e" />
                    <Text
                      style={{
                        color: "#7e3f2d",
                        fontSize: 16,
                        marginTop: 16,
                      }}
                    >
                      {isTranscribing
                        ? "Processing voice memo..."
                        : "Thinking..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text
                      style={{
                        color: "#ffefdd",
                        fontSize: 20,
                        fontWeight: "600",
                        textAlign: "center",
                        marginBottom: 32,
                        lineHeight: 28,
                      }}
                    >
                      {getCurrentPrompt()}
                    </Text>

                    <TextInput
                      multiline
                      placeholder="Tap here to start writing..."
                      placeholderTextColor="#7e3f2d"
                      style={{
                        backgroundColor: "transparent",
                        color: "#ffefdd",
                        fontSize: 18,
                        minHeight: 200,
                        textAlignVertical: "top",
                        fontFamily: "Inter_400Regular",
                        lineHeight: 26,
                      }}
                      value={content}
                      onChangeText={setContent}
                      autoFocus={false}
                      editable={!recorderState.isRecording}
                    />

                    {/* Voice Memo Button */}
                    <View style={{ alignItems: "center", marginTop: 24 }}>
                      <SmoothButton
                        onPress={handleVoiceMemo}
                        disabled={isTranscribing}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: recorderState.isRecording
                            ? "#f87171"
                            : "#7e3f2d",
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor: "#f9a35e",
                        }}
                      >
                        <Animated.View
                          style={{
                            transform: [
                              {
                                scale: recorderState.isRecording
                                  ? pulseAnim
                                  : 1,
                              },
                            ],
                          }}
                        >
                          <Mic
                            color={
                              recorderState.isRecording ? "#fff" : "#f9a35e"
                            }
                            size={32}
                          />
                        </Animated.View>
                      </SmoothButton>

                      {recorderState.isRecording && (
                        <View style={{ marginTop: 12, alignItems: "center" }}>
                          <Text
                            style={{
                              color: "#f87171",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            Recording...
                          </Text>
                          <Text
                            style={{
                              color: "#7e3f2d",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {formatDuration(recorderState.currentTime)}
                          </Text>
                          <Text
                            style={{
                              color: "#7e3f2d",
                              fontSize: 12,
                              marginTop: 8,
                            }}
                          >
                            Tap again to finish
                          </Text>
                        </View>
                      )}

                      {!recorderState.isRecording && (
                        <Text
                          style={{
                            color: "#7e3f2d",
                            fontSize: 12,
                            marginTop: 8,
                          }}
                        >
                          or record a voice memo
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            {step === "complete" && (
              <View style={{ width: "100%", marginTop: 32 }}>
                <View style={{ alignItems: "center", marginBottom: 32 }}>
                  <View
                    style={{
                      backgroundColor: "#f9a35e",
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 24,
                    }}
                  >
                    <Check size={48} color="#4e1709" />
                  </View>
                  <Text
                    style={{
                      color: "#ffefdd",
                      fontSize: 24,
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    You did it
                  </Text>
                  <Text
                    style={{
                      color: "#7e3f2d",
                      fontSize: 16,
                      textAlign: "center",
                      lineHeight: 24,
                    }}
                  >
                    Your thoughts are safe here. How are you feeling?
                  </Text>
                </View>

                <SmoothButton
                  onPress={handleContinue}
                  style={{
                    backgroundColor: "#7e3f2d",
                    padding: 20,
                    borderRadius: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <MessageCircle color="#f9a35e" size={24} />
                  <Text
                    style={{
                      color: "#ffefdd",
                      fontSize: 16,
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    Continue chatting
                  </Text>
                </SmoothButton>

                <SmoothButton
                  onPress={handleCloseJournal}
                  style={{
                    backgroundColor: "#f9a35e",
                    paddingVertical: 18,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#4e1709",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Close Journal
                  </Text>
                </SmoothButton>
              </View>
            )}

            {step === "reminder" && (
              <View style={{ width: "100%", marginTop: 32 }}>
                <Text
                  style={{
                    color: "#ffefdd",
                    fontSize: 20,
                    fontWeight: "600",
                    textAlign: "center",
                    marginBottom: 32,
                    lineHeight: 30,
                    fontStyle: "italic",
                  }}
                >
                  If there's anything else on your mind — tasks or swirling
                  thoughts — place it here. You can handle it tomorrow.
                </Text>

                <TextInput
                  multiline
                  placeholder="Type anything you want to revisit..."
                  placeholderTextColor="#7e3f2d"
                  style={{
                    backgroundColor: "#7e3f2d",
                    color: "#ffefdd",
                    fontSize: 16,
                    minHeight: 120,
                    textAlignVertical: "top",
                    fontFamily: "Inter_400Regular",
                    lineHeight: 24,
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                    marginBottom: 24,
                  }}
                  value={content}
                  onChangeText={setContent}
                />

                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <SmoothButton
                    onPress={handleSkipReminder}
                    style={{
                      flex: 1,
                      backgroundColor: "#7e3f2d",
                      paddingVertical: 18,
                      paddingHorizontal: 20,
                      borderRadius: 20,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#f9a35e",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffefdd",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Skip
                    </Text>
                  </SmoothButton>

                  <SmoothButton
                    onPress={handleContinueFromReminder}
                    disabled={!content.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: content.trim() ? "#f9a35e" : "#7e3f2d",
                      paddingVertical: 18,
                      paddingHorizontal: 32,
                      borderRadius: 20,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: content.trim() ? "#4e1709" : "#7e3f2d",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      Continue
                    </Text>
                  </SmoothButton>
                </View>
              </View>
            )}

            {step === "reminder_time" && (
              <View style={{ width: "100%", marginTop: 32 }}>
                <Text
                  style={{
                    color: "#ffefdd",
                    fontSize: 22,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  When should we remind you?
                </Text>
                <Text
                  style={{
                    color: "#7e3f2d",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 32,
                    lineHeight: 24,
                  }}
                >
                  Set a day and time to revisit: "{reminderTasks}"
                </Text>

                {/* Calendar */}
                <View
                  style={{
                    marginBottom: 24,
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  <Calendar
                    onDayPress={(day) => {
                      setSelectedDate(day.dateString);
                    }}
                    markedDates={getMarkedDates()}
                    minDate={format(new Date(), "yyyy-MM-dd")}
                    maxDate={format(addDays(new Date(), 90), "yyyy-MM-dd")}
                    theme={{
                      backgroundColor: "#7e3f2d",
                      calendarBackground: "#7e3f2d",
                      textSectionTitleColor: "#ffefdd",
                      selectedDayBackgroundColor: "#f9a35e",
                      selectedDayTextColor: "#4e1709",
                      todayTextColor: "#f9a35e",
                      dayTextColor: "#ffefdd",
                      textDisabledColor: "#5a2b1f",
                      monthTextColor: "#ffefdd",
                      indicatorColor: "#f9a35e",
                      arrowColor: "#f9a35e",
                    }}
                  />
                </View>

                {/* Time Picker */}
                {selectedDate && (
                  <View style={{ marginBottom: 24 }}>
                    <TimePickerButtons />
                  </View>
                )}

                <SmoothButton
                  onPress={handleSaveReminderWithTime}
                  disabled={!selectedDate}
                  style={{
                    backgroundColor: selectedDate ? "#f9a35e" : "#7e3f2d",
                    paddingVertical: 18,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: selectedDate ? "#4e1709" : "#7e3f2d",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Set Reminder
                  </Text>
                </SmoothButton>
              </View>
            )}

            {step === "closing" && (
              <View style={{ width: "100%", marginTop: 60 }}>
                <View style={{ alignItems: "center", marginBottom: 48 }}>
                  <Text
                    style={{
                      color: "#ffefdd",
                      fontSize: 26,
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: 20,
                      lineHeight: 36,
                    }}
                  >
                    You've done enough for today
                  </Text>
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 18,
                      textAlign: "center",
                      lineHeight: 28,
                      marginBottom: 12,
                    }}
                  >
                    Your thoughts are safe here.
                  </Text>
                  <Text
                    style={{
                      color: "#7e3f2d",
                      fontSize: 18,
                      textAlign: "center",
                      lineHeight: 28,
                    }}
                  >
                    You can rest now.
                  </Text>
                </View>

                <SmoothButton
                  onPress={handleFinalSave}
                  disabled={isSaving}
                  style={{
                    backgroundColor: "#f9a35e",
                    paddingVertical: 18,
                    borderRadius: 20,
                    alignItems: "center",
                    marginTop: 40,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#4e1709" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "#4e1709",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      Goodnight
                    </Text>
                  )}
                </SmoothButton>
              </View>
            )}

            {step === "journaling" && (
              <View style={{ width: "100%", marginTop: 24 }}>
                <Text
                  style={{
                    color: "#ffefdd",
                    fontSize: 20,
                    fontWeight: "600",
                    textAlign: "center",
                    marginBottom: 32,
                    lineHeight: 28,
                  }}
                >
                  {getCurrentPrompt()}
                </Text>

                <TextInput
                  multiline
                  placeholder="Tap here to start writing..."
                  placeholderTextColor="#7e3f2d"
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffefdd",
                    fontSize: 18,
                    minHeight: 200,
                    textAlignVertical: "top",
                    fontFamily: "Inter_400Regular",
                    lineHeight: 26,
                  }}
                  value={content}
                  onChangeText={setContent}
                  autoFocus={false}
                  editable={!recorderState.isRecording}
                />

                {/* Voice Memo Button for brain dump */}
                <View style={{ alignItems: "center", marginTop: 24 }}>
                  <SmoothButton
                    onPress={handleVoiceMemo}
                    disabled={isTranscribing}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: recorderState.isRecording
                        ? "#f87171"
                        : "#7e3f2d",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: "#f9a35e",
                    }}
                  >
                    <Animated.View
                      style={{
                        transform: [
                          { scale: recorderState.isRecording ? pulseAnim : 1 },
                        ],
                      }}
                    >
                      <Mic
                        color={recorderState.isRecording ? "#fff" : "#f9a35e"}
                        size={32}
                      />
                    </Animated.View>
                  </SmoothButton>

                  {recorderState.isRecording && (
                    <View style={{ marginTop: 12, alignItems: "center" }}>
                      <Text
                        style={{
                          color: "#f87171",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        Recording...
                      </Text>
                      <Text
                        style={{ color: "#7e3f2d", fontSize: 12, marginTop: 4 }}
                      >
                        {formatDuration(recorderState.currentTime)}
                      </Text>
                      <Text
                        style={{ color: "#7e3f2d", fontSize: 12, marginTop: 8 }}
                      >
                        Tap again to finish
                      </Text>
                    </View>
                  )}

                  {!recorderState.isRecording && (
                    <Text
                      style={{ color: "#7e3f2d", fontSize: 12, marginTop: 8 }}
                    >
                      or record a voice memo
                    </Text>
                  )}
                </View>
              </View>
            )}

            {step === "brain_dump_choice" && (
              <View style={{ width: "100%", marginTop: 32 }}>
                <Text
                  style={{
                    color: "#ffefdd",
                    fontSize: 22,
                    fontWeight: "600",
                    textAlign: "center",
                    marginBottom: 12,
                    lineHeight: 32,
                  }}
                >
                  You've let it all out
                </Text>
                <Text
                  style={{
                    color: "#7e3f2d",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 48,
                    lineHeight: 24,
                  }}
                >
                  Would you like to continue with a guided experience, or close
                  the journal for tonight?
                </Text>

                <SmoothButton
                  onPress={handleStartGuidedFromBrainDump}
                  style={{
                    backgroundColor: "#7e3f2d",
                    padding: 24,
                    borderRadius: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                  }}
                >
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 18,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    Continue with Guided
                  </Text>
                  <Text style={{ color: "#ffefdd", fontSize: 14 }}>
                    I'll walk you through gratitude and reflection
                  </Text>
                </SmoothButton>

                <SmoothButton
                  onPress={handleCloseJournal}
                  style={{
                    backgroundColor: "#f9a35e",
                    paddingVertical: 18,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#4e1709",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Close Journal
                  </Text>
                </SmoothButton>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Persistent Action Buttons - hide during recording or transcribing */}
        {(step === "gratitude" ||
          step === "brain_dump_1" ||
          step === "brain_dump_2" ||
          step === "brain_dump_3" ||
          step === "last_thoughts" ||
          step === "continue" ||
          step === "journaling") &&
          !recorderState.isRecording &&
          !isTranscribing && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#4e1709",
                paddingHorizontal: 24,
                paddingTop: 16,
                paddingBottom: insets.bottom + 16,
                borderTopWidth: 1,
                borderTopColor: "#7e3f2d",
              }}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
                <SmoothButton
                  onPress={handleContinueJournal}
                  style={{
                    flex: 1,
                    backgroundColor: "#f9a35e",
                    paddingVertical: 18,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#4e1709",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Continue
                  </Text>
                </SmoothButton>

                <SmoothButton
                  onPress={handleCloseJournalNow}
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    paddingVertical: 18,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#7e3f2d",
                  }}
                >
                  <Text
                    style={{
                      color: "#7e3f2d",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Close Journal
                  </Text>
                </SmoothButton>
              </View>
            </View>
          )}
      </KeyboardAvoidingAnimatedView>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </View>
  );
}
