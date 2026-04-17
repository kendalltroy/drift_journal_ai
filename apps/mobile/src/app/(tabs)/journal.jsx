import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronRight, Trash2 } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { authFetch } from "@/utils/authFetch";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: entries, isLoading, refetch } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      const response = await authFetch("/api/journal");
      if (!response.ok) throw new Error("Failed to fetch entries");
      return response.json();
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const deleteEntry = useMutation({
    mutationFn: async (id) => {
      const response = await authFetch(`/api/journal/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });

  const deleteAll = useMutation({
    mutationFn: async () => {
      const response = await authFetch("/api/journal", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete entries");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });

  const handleDeleteEntry = (id) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(id) },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All History",
      "This will permanently delete all your journal entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: () => deleteAll.mutate() },
      ]
    );
  };

  const SmoothButton = ({ onPress, children, style }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <Animated.View style={[style, { transform: [{ scale: pressAnim }] }]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEntry = ({ item }) => (
    <View style={{ marginBottom: 12 }}>
      <SmoothButton
        onPress={() => router.push(`/entry/${item.id}`)}
        style={{
          backgroundColor: "#7e3f2d",
          padding: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#f9a35e",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ color: "#f9a35e", fontWeight: "700", fontSize: 16 }}>
            {item.emotion}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ color: "#ffefdd", fontSize: 12 }}>
              {format(new Date(item.created_at), "MMM d, h:mm a")}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteEntry(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#f9a35e" />
            </TouchableOpacity>
          </View>
        </View>
        {item.summary && (
          <Text style={{ color: "#ffefdd", fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
            {item.summary}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Text style={{ color: "#7e3f2d", fontSize: 12 }}>View details</Text>
          <ChevronRight color="#7e3f2d" size={14} />
        </View>
      </SmoothButton>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}>
      <View style={{ padding: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#ffefdd" }}>
            Your History
          </Text>
          {entries?.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll}>
              <Text style={{ color: "#f9a35e", fontSize: 14 }}>Delete All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#f9a35e" style={{ marginTop: 40 }} />
        ) : entries?.length > 0 ? (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEntry}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Text style={{ color: "#7e3f2d", fontSize: 16 }}>
              No entries yet. Start tonight.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
