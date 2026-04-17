import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#7e3f2d",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ChevronLeft size={24} color="#ffefdd" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#ffefdd",
            flex: 1,
          }}
        >
          Privacy & Security
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: "#ffefdd", fontSize: 17, lineHeight: 26, fontStyle: "italic", marginBottom: 28 }}>
          Your privacy, thoughtfully kept.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 28 }}>
          Drift is a space for your thoughts before sleep. What you share here is personal — and it deserves to be treated that way. This page explains exactly what we collect, what we do with it, and the choices that are always yours.
        </Text>

        {/* What we collect */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginBottom: 12 }}>What we collect</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
          Drift stores two separate things from your journaling sessions:
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
          Your journal entries — the actual words you write or speak — are saved so you can revisit them in your history. Only you can ever read them. Not our team, not our AI, not anyone else.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
          A short AI-generated summary of each session is also created — one or two sentences that capture the general theme of what was on your mind. This summary is used only to help the AI remember context about you over time. After 7 days, the AI stops referencing it entirely, though it remains in your history.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 4 }}>
          We also store:
        </Text>
        {[
          "The emotion you selected at the start of each session",
          "Session date, time, and duration",
          "A sentiment level: low, medium, or high",
          "Theme tags from a fixed list (e.g. work, relationships, health, self-worth, future, family, finance, sleep, identity, uncertainty)",
          "Any tasks or thoughts you chose to carry into tomorrow",
        ].map((item, i) => (
          <Text key={i} style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 4, paddingLeft: 8 }}>
            • {item}
          </Text>
        ))}

        {/* What we never do */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>What we never do</Text>
        {[
          "Read your journal entries — no one on our team can access them",
          "Use your entries to train AI models without your explicit consent",
          "Sell your data to anyone",
          "Use your data for advertising",
          "Share your information with third parties",
        ].map((item, i) => (
          <Text key={i} style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 4, paddingLeft: 8 }}>
            • {item}
          </Text>
        ))}

        {/* How the AI works */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>How the AI works</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
          The AI guides your session in real time. Every response is designed to acknowledge how you're feeling, offer a calm affirmation, and ask a gentle follow-up question.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
          The AI is not a therapist. It cannot diagnose, treat, or provide medical advice. It is here to help you wind down and clear your head — nothing more.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 0 }}>
          The AI only references summaries of your past sessions, never your raw journal text. And it only looks back 7 days. Anything older than that is yours alone.
        </Text>

        {/* Your safety */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Your safety</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          If you ever share something that suggests you may be in crisis, Drift will pause and provide support resources — including the 988 Suicide & Crisis Lifeline (call or text 988 in the US). Your safety always comes before the journaling session.
        </Text>

        {/* Your rights */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Your rights</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 8 }}>
          You are in control of your data at all times. You can:
        </Text>
        {[
          "View your full journal history in the app",
          "Delete any individual entry",
          "Delete your account and all associated data permanently",
          "Opt out of pattern recognition and personalization",
          "Request that we stop processing your data",
        ].map((item, i) => (
          <Text key={i} style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 4, paddingLeft: 8 }}>
            • {item}
          </Text>
        ))}
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginTop: 12 }}>
          To exercise any of these rights, go to Settings → Privacy, or contact us at{" "}
          <Text onPress={() => Linking.openURL("mailto:driftjournal8@gmail.com")} style={{ color: "#f9a35e", textDecorationLine: "underline" }}>
            driftjournal8@gmail.com
          </Text>
          .
        </Text>

        {/* Security */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Security</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          All data is transmitted over encrypted connections. Your journal entries are stored in a secure database where only you can access them — enforced at the technical level, not just by policy. Notification reminders never contain your journal content.
        </Text>

        {/* Age requirement */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Age requirement</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          Drift is for users 18 and older. If you believe a minor has created an account, contact us at{" "}
          <Text onPress={() => Linking.openURL("mailto:driftjournal8@gmail.com")} style={{ color: "#f9a35e", textDecorationLine: "underline" }}>
            driftjournal8@gmail.com
          </Text>
          {" "}and we will remove their data promptly.
        </Text>

        {/* Changes to this policy */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Changes to this policy</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          If we change how we handle your data in a meaningful way, we'll notify you in the app before those changes take effect. You'll always have the option to review before continuing.
        </Text>

        {/* Questions */}
        <Text style={{ color: "#f9a35e", fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 }}>Questions?</Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          Reach us at{" "}
          <Text onPress={() => Linking.openURL("mailto:driftjournal8@gmail.com")} style={{ color: "#f9a35e", textDecorationLine: "underline" }}>
            driftjournal8@gmail.com
          </Text>
          {" "}or through Settings → Help Center in the app.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/full-policy")}
          style={{
            marginTop: 32,
            borderWidth: 1,
            borderColor: "#f9a35e",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f9a35e", fontWeight: "600", fontSize: 15 }}>
            View Full Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/terms")}
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#f9a35e",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f9a35e", fontWeight: "600", fontSize: 15 }}>
            View Terms & Conditions
          </Text>
        </TouchableOpacity>

        <Text style={{ color: "#7e3f2d", fontSize: 13, lineHeight: 20, marginTop: 24, textAlign: "center" }}>
          Last updated: April 4, 2026
        </Text>
      </ScrollView>
    </View>
  );
}
