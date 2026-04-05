import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Owl from "@/components/Owl";

const emotions = [
  { id: "anxious", label: "Anxious", color: "#FCD34D" },
  { id: "stressed", label: "Stressed", color: "#F87171" },
  { id: "overwhelmed", label: "Overwhelmed", color: "#60A5FA" },
  { id: "existential", label: "Existential", color: "#A78BFA" },
  { id: "sad", label: "Sad", color: "#94A3B8" },
  { id: "peaceful", label: "Peaceful", color: "#34D399" },
  { id: "excited", label: "Excited", color: "#F472B6" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const handleStart = (emotion) => {
    setSelectedEmotion(emotion);
    router.push({
      pathname: "/entry/new",
      params: { emotion: emotion.label },
    });
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
              onPress={() => handleStart(emotion)}
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
              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {emotion.label}
              </Text>
            </SmoothButton>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
