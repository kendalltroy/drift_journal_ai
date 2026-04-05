import React, { useState, useEffect } from "react";
import { View, Text, Switch, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PERSONALIZATION_KEY = "drift_personalization_enabled";

export default function PersonalizationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PERSONALIZATION_KEY).then((val) => {
      if (val !== null) setEnabled(val === "true");
    });
  }, []);

  const toggle = (value) => {
    setEnabled(value);
    AsyncStorage.setItem(PERSONALIZATION_KEY, value.toString());
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}>
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
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
          <ChevronLeft size={24} color="#ffefdd" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffefdd", flex: 1 }}>
          Personalization
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle card */}
        <View
          style={{
            backgroundColor: "#7e3f2d",
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: "#f9a35e",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: "#ffefdd", fontSize: 17, fontWeight: "700", flex: 1, marginRight: 16 }}>
              Pattern recognition & personalization
            </Text>
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ false: "#4e1709", true: "#f9a35e" }}
              thumbColor="#ffefdd"
            />
          </View>
          <Text style={{ color: enabled ? "#f9a35e" : "#7e3f2d", fontSize: 13, fontWeight: "600" }}>
            {enabled ? "On — your history informs your sessions" : "Off — default prompts only"}
          </Text>
        </View>

        {/* Explanation */}
        <Text style={{ color: "#f9a35e", fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
          What this does
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 20 }}>
          When personalization is on, Drift references summaries of your last 7 days of journal sessions to tailor the AI's prompts to your patterns — things like recurring worries, themes, or emotional trends.
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 20 }}>
          When it's off, the AI uses only your current session and emotion. No past data is referenced. Prompts will be warm and helpful, but not shaped by your history.
        </Text>

        <Text style={{ color: "#f9a35e", fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
          What stays the same
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24, marginBottom: 20 }}>
          Turning this off does not delete your journal history. Your entries remain saved and accessible in the History tab. It only affects what the AI sees during a session.
        </Text>

        <Text style={{ color: "#f9a35e", fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
          Your raw entries are never shared
        </Text>
        <Text style={{ color: "#ffefdd", fontSize: 15, lineHeight: 24 }}>
          Whether personalization is on or off, the AI never receives your raw journal text — only short AI-generated summaries when personalization is enabled.
        </Text>

        <Text style={{ color: "#7e3f2d", fontSize: 13, marginTop: 32, textAlign: "center" }}>
          You can change this setting at any time.
        </Text>
      </ScrollView>
    </View>
  );
}
