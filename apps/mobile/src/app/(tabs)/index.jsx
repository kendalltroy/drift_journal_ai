import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Owl from "@/components/Owl";

const emotions = [
  { id: "peaceful", label: "Peaceful", color: "#34D399" },
  { id: "excited", label: "Excited", color: "#F472B6" },
  { id: "anxious", label: "Anxious", color: "#FCD34D" },
  { id: "stressed", label: "Stressed", color: "#F87171" },
  { id: "overwhelmed", label: "Overwhelmed", color: "#60A5FA" },
  { id: "sad", label: "Sad", color: "#94A3B8" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherEmotion, setOtherEmotion] = useState("");

  const handleStart = (emotionLabel) => {
    router.push({
      pathname: "/entry/new",
      params: { emotion: emotionLabel },
    });
  };

  const handleOtherSubmit = () => {
    const trimmed = otherEmotion.trim();
    if (!trimmed) return;
    setOtherEmotion("");
    setShowOtherInput(false);
    handleStart(trimmed);
  };

  const SmoothButton = ({ onPress, children, style }) => {
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

  return (
    <View
      style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginVertical: 40 }}>
          <Owl size={140} />
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: "#ffefdd",
            textAlign: "center",
            marginBottom: 12,
            fontFamily: "Inter_700Bold",
          }}
        >
          How are you feeling tonight?
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#7e3f2d",
            textAlign: "center",
            marginBottom: 40,
            fontFamily: "Inter_400Regular",
          }}
        >
          Let's take a moment to check in with yourself.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {emotions.map((emotion) => (
            <SmoothButton
              key={emotion.id}
              onPress={() => handleStart(emotion.label)}
              style={{
                backgroundColor: "#7e3f2d",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: "#f9a35e",
                minWidth: "40%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "600" }}>
                {emotion.label}
              </Text>
            </SmoothButton>
          ))}

          <SmoothButton
            onPress={() => setShowOtherInput((v) => !v)}
            style={{
              backgroundColor: showOtherInput ? "#f9a35e" : "#7e3f2d",
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: "#f9a35e",
              minWidth: "40%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: showOtherInput ? "#4e1709" : "#ffefdd",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Other
            </Text>
          </SmoothButton>
        </View>

        {showOtherInput && (
          <View style={{ marginTop: 24 }}>
            <TextInput
              value={otherEmotion}
              onChangeText={setOtherEmotion}
              placeholder="How are you feeling?"
              placeholderTextColor="#7e3f2d"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleOtherSubmit}
              style={{
                backgroundColor: "#3a1005",
                color: "#ffefdd",
                fontSize: 16,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#7e3f2d",
                marginBottom: 12,
              }}
            />
            <SmoothButton
              onPress={handleOtherSubmit}
              style={{
                backgroundColor: otherEmotion.trim() ? "#f9a35e" : "#7e3f2d",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: otherEmotion.trim() ? "#4e1709" : "#7e3f2d",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Start Journaling
              </Text>
            </SmoothButton>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
