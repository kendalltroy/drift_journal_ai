import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { X, Volume2 } from "lucide-react-native";
import { format } from "date-fns";
import Owl from "@/components/Owl";
import { Audio } from "expo-av";
import { getJournalLocally } from "@/utils/journalStorage";
import { authFetch } from "@/utils/authFetch";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [playingAudio, setPlayingAudio] = React.useState(null);
  const soundRef = useRef(null);

  // Fetch both backend metadata AND local content
  const { data: entry, isLoading } = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const response = await authFetch(`/api/journal/${id}`);
      if (!response.ok) throw new Error("Failed to fetch entry");
      const backendData = await response.json();

      // Get local content (conversation history + audio)
      const localData = await getJournalLocally(id);

      // Merge backend metadata with local content
      return {
        ...backendData,
        conversationHistory: localData?.conversationHistory || [],
        audio_urls: localData?.audioUrls || [],
      };
    },
  });

  // Parse structured conversation from local storage
  const parseConversation = () => {
    if (!entry?.conversationHistory) return [];

    const conversation = [];
    entry.conversationHistory.forEach((msg) => {
      if (msg.role === "assistant") {
        conversation.push({ type: "prompt", text: msg.content });
      } else if (msg.role === "user") {
        conversation.push({ type: "response", text: msg.content });
      }
    });

    return conversation;
  };

  const playAudio = async (url) => {
    try {
      // Stop currently playing audio if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingAudio === url) {
        setPlayingAudio(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlayingAudio(url);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
          soundRef.current = null;
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingAudio(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

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

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#4e1709",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#f9a35e" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#4e1709",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#ffefdd", fontSize: 16 }}>Entry not found</Text>
      </View>
    );
  }

  const conversation = parseConversation();

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
        }}
      >
        <SmoothButton onPress={() => router.back()} style={{ padding: 4 }}>
          <X color="#7e3f2d" size={28} />
        </SmoothButton>
        <Text style={{ color: "#ffefdd", fontSize: 18, fontWeight: "600" }}>
          {entry.emotion} Night
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Owl size={80} />
          <Text
            style={{
              color: "#7e3f2d",
              fontSize: 14,
              marginTop: 12,
              marginBottom: 32,
            }}
          >
            {format(new Date(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>

        {/* Display conversation from local storage */}
        {conversation.length > 0 ? (
          conversation.map((item, index) => (
            <View key={index} style={{ marginBottom: 24 }}>
              {item.type === "prompt" ? (
                <View>
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 12,
                      fontWeight: "600",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Owl asked
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#7e3f2d",
                      padding: 16,
                      borderRadius: 16,
                      borderLeftWidth: 3,
                      borderLeftColor: "#f9a35e",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffefdd",
                        fontSize: 16,
                        lineHeight: 24,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text
                    style={{
                      color: "#f9a35e",
                      fontSize: 12,
                      fontWeight: "600",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    You wrote
                  </Text>
                  <View
                    style={{
                      backgroundColor: "rgba(126, 63, 45, 0.3)",
                      padding: 16,
                      borderRadius: 16,
                      borderLeftWidth: 3,
                      borderLeftColor: "#ffefdd",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffefdd",
                        fontSize: 16,
                        lineHeight: 24,
                        fontStyle: "italic",
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: "rgba(126, 63, 45, 0.3)",
              padding: 20,
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: "#7e3f2d",
                fontSize: 14,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Content for this entry is stored locally on your device. If you
              can't see it, it may have been cleared.
            </Text>
          </View>
        )}

        {/* Audio memos section from local storage */}
        {entry.audio_urls && entry.audio_urls.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "#f9a35e",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Voice Memos ({entry.audio_urls.length})
            </Text>
            {entry.audio_urls.map((url, index) => (
              <SmoothButton
                key={index}
                onPress={() => playAudio(url)}
                style={{
                  backgroundColor: "#7e3f2d",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderWidth: playingAudio === url ? 2 : 1,
                  borderColor: playingAudio === url ? "#f9a35e" : "#7e3f2d",
                }}
              >
                <Volume2
                  color={playingAudio === url ? "#f9a35e" : "#ffefdd"}
                  size={20}
                />
                <Text
                  style={{
                    color: playingAudio === url ? "#f9a35e" : "#ffefdd",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {playingAudio === url
                    ? "Playing..."
                    : `Voice memo ${index + 1}`}
                </Text>
              </SmoothButton>
            ))}
          </View>
        )}

        {/* Summary and tags from backend */}
        {entry.summary && (
          <View
            style={{
              marginTop: 32,
              backgroundColor: "rgba(249, 163, 94, 0.1)",
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#f9a35e",
            }}
          >
            <Text
              style={{
                color: "#f9a35e",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Summary
            </Text>
            <Text
              style={{
                color: "#ffefdd",
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {entry.summary}
            </Text>
          </View>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "#f9a35e",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Themes
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {entry.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#7e3f2d",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "#f9a35e",
                  }}
                >
                  <Text style={{ color: "#ffefdd", fontSize: 14 }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sentiment Score */}
        {entry.sentiment_score && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "#f9a35e",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Emotional Intensity
            </Text>
            <View
              style={{
                backgroundColor: "#7e3f2d",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#f9a35e",
              }}
            >
              <Text
                style={{
                  color: "#ffefdd",
                  fontSize: 16,
                  textAlign: "center",
                  textTransform: "capitalize",
                }}
              >
                {entry.sentiment_score}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
