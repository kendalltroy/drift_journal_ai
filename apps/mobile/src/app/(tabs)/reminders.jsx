import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { format, addDays, isPast } from "date-fns";
import { Clock, Check, Trash2, X, Calendar as CalendarIcon } from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch } from "@/utils/authFetch";
import NotificationManager from "@/utils/notifications";

const NOTIF_IDS_KEY = "drift_thought_notif_ids";

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

const formatScheduledTime = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = format(date, "h:mm a");
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return format(date, "MMM d 'at' h:mm a");
};

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: 9, minute: 0 });

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await authFetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }) => {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id) => {
      const stored = await AsyncStorage.getItem(NOTIF_IDS_KEY);
      const map = stored ? JSON.parse(stored) : {};
      if (map[id]) {
        await NotificationManager.cancelThoughtReminder(map[id]);
        delete map[id];
        await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(map));
      }
      const res = await authFetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const reschedule = useMutation({
    mutationFn: async ({ id, content, scheduledDateTime }) => {
      const stored = await AsyncStorage.getItem(NOTIF_IDS_KEY);
      const map = stored ? JSON.parse(stored) : {};
      if (map[id]) {
        await NotificationManager.cancelThoughtReminder(map[id]);
      }
      const notifId = await NotificationManager.scheduleThoughtReminder(content, scheduledDateTime);
      if (notifId) {
        map[id] = notifId;
        await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(map));
      }
      const res = await authFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ scheduled_time: scheduledDateTime.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to reschedule task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setRescheduleTask(null);
      setSelectedDate(null);
      setSelectedTime({ hour: 9, minute: 0 });
    },
  });

  const handleDelete = (id) => {
    Alert.alert("Delete Reminder", "Remove this reminder?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask.mutate(id) },
    ]);
  };

  const handleRescheduleConfirm = () => {
    if (!selectedDate || !rescheduleTask) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d, selectedTime.hour, selectedTime.minute, 0, 0);
    reschedule.mutate({ id: rescheduleTask.id, content: rescheduleTask.content, scheduledDateTime: dt });
  };

  const openReschedule = (task) => {
    setRescheduleTask(task);
    if (task.scheduled_time) {
      const d = new Date(task.scheduled_time);
      setSelectedDate(format(d, "yyyy-MM-dd"));
      setSelectedTime({ hour: d.getHours(), minute: d.getMinutes() });
    } else {
      setSelectedDate(null);
      setSelectedTime({ hour: 9, minute: 0 });
    }
  };

  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const SmoothButton = ({ onPress, children, style, disabled }) => {
    const anim = useRef(new Animated.Value(1)).current;
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <Animated.View style={[style, { transform: [{ scale: anim }] }]}>{children}</Animated.View>
      </TouchableOpacity>
    );
  };

  const TaskCard = ({ task }) => {
    const isOverdue = task.scheduled_time && isPast(new Date(task.scheduled_time)) && !task.completed;
    const timeLabel = formatScheduledTime(task.scheduled_time);

    return (
      <View
        style={{
          backgroundColor: task.completed ? "#3a1005" : "#7e3f2d",
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: task.completed ? "#3a1005" : "#f9a35e",
          opacity: task.completed ? 0.6 : 1,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        {/* Check button */}
        <TouchableOpacity
          onPress={() => toggleComplete.mutate({ id: task.id, completed: !task.completed })}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: task.completed ? "#f9a35e" : "#f9a35e",
            backgroundColor: task.completed ? "#f9a35e" : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {task.completed && <Check size={14} color="#4e1709" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: task.completed ? "#7e3f2d" : "#ffefdd",
              fontSize: 15,
              lineHeight: 22,
              textDecorationLine: task.completed ? "line-through" : "none",
            }}
          >
            {task.content}
          </Text>
          {timeLabel && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Clock size={12} color={isOverdue ? "#f87171" : "#f9a35e"} />
              <Text style={{ color: isOverdue ? "#f87171" : "#f9a35e", fontSize: 12 }}>
                {timeLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {!task.completed && (
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity onPress={() => openReschedule(task)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CalendarIcon size={16} color="#7e3f2d" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Trash2 size={16} color="#7e3f2d" />
            </TouchableOpacity>
          </View>
        )}
        {task.completed && (
          <TouchableOpacity onPress={() => handleDelete(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={16} color="#7e3f2d" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const TimePickerInline = () => {
    const { hour12: currentHour12, period: currentPeriod } = to12Hour(selectedTime.hour);
    const [hourText, setHourText] = useState(currentHour12.toString());
    const [minuteText, setMinuteText] = useState(selectedTime.minute.toString().padStart(2, "0"));

    const commitHour = (text) => {
      const val = parseInt(text, 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        setSelectedTime((t) => ({ ...t, hour: to24Hour(val, currentPeriod) }));
        setHourText(val.toString());
      } else {
        setHourText(currentHour12.toString());
      }
    };

    const commitMinute = (text) => {
      const val = parseInt(text, 10);
      if (!isNaN(val) && val >= 0 && val <= 59) {
        setSelectedTime((t) => ({ ...t, minute: val }));
        setMinuteText(val.toString().padStart(2, "0"));
      } else {
        setMinuteText(selectedTime.minute.toString().padStart(2, "0"));
      }
    };

    return (
      <View style={{ marginTop: 16 }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 20,
          backgroundColor: "#7e3f2d",
          borderRadius: 16,
          borderWidth: 2,
          borderColor: "#f9a35e",
          marginBottom: 16,
        }}>
          <Clock color="#f9a35e" size={24} />
          <TextInput
            value={hourText}
            onChangeText={setHourText}
            onBlur={() => commitHour(hourText)}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={{ color: "#ffefdd", fontSize: 40, fontWeight: "700", textAlign: "center", width: 60, backgroundColor: "transparent" }}
          />
          <Text style={{ color: "#ffefdd", fontSize: 40, fontWeight: "700" }}>:</Text>
          <TextInput
            value={minuteText}
            onChangeText={setMinuteText}
            onBlur={() => commitMinute(minuteText)}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={{ color: "#ffefdd", fontSize: 40, fontWeight: "700", textAlign: "center", width: 60, backgroundColor: "transparent" }}
          />
          <Text style={{ color: "#f9a35e", fontSize: 20, fontWeight: "700" }}>{currentPeriod}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {["AM", "PM"].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setSelectedTime((t) => ({ ...t, hour: to24Hour(currentHour12, p) }))}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: currentPeriod === p ? "#f9a35e" : "#7e3f2d",
                borderWidth: 1,
                borderColor: "#f9a35e",
                alignItems: "center",
              }}
            >
              <Text style={{ color: currentPeriod === p ? "#4e1709" : "#ffefdd", fontSize: 16, fontWeight: "700" }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: "9:00 AM", hour: 9, minute: 0 },
            { label: "12:00 PM", hour: 12, minute: 0 },
            { label: "6:00 PM", hour: 18, minute: 0 },
            { label: "9:00 PM", hour: 21, minute: 0 },
          ].map((p) => (
            <TouchableOpacity
              key={p.label}
              onPress={() => setSelectedTime({ hour: p.hour, minute: p.minute })}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: "#7e3f2d",
                borderWidth: 1,
                borderColor: "#f9a35e",
              }}
            >
              <Text style={{ color: "#ffefdd", fontSize: 13 }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}>
      <View style={{ padding: 24, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#ffefdd" }}>Reminders</Text>
        <Text style={{ color: "#7e3f2d", fontSize: 14, marginTop: 4 }}>Thoughts you set aside for later</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#f9a35e" style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32 }}>
          <Text style={{ color: "#7e3f2d", fontSize: 16, textAlign: "center" }}>
            No reminders yet. During journaling, you can save thoughts to revisit later.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
          {active.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#7e3f2d", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Active
              </Text>
              {active.map((t) => <TaskCard key={t.id} task={t} />)}
            </View>
          )}

          {completed.length > 0 && (
            <View>
              <Text style={{ color: "#7e3f2d", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Completed
              </Text>
              {completed.map((t) => <TaskCard key={t.id} task={t} />)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduleTask} animationType="slide" transparent onRequestClose={() => setRescheduleTask(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#4e1709", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24, maxHeight: "90%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ color: "#ffefdd", fontSize: 18, fontWeight: "700" }}>Reschedule</Text>
              <TouchableOpacity onPress={() => setRescheduleTask(null)}>
                <X color="#7e3f2d" size={24} />
              </TouchableOpacity>
            </View>

            {rescheduleTask && (
              <Text style={{ color: "#7e3f2d", fontSize: 14, marginBottom: 20, lineHeight: 20 }} numberOfLines={2}>
                "{rescheduleTask.content}"
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Calendar
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={{
                  ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: "#f9a35e", textColor: "#4e1709" } } : {}),
                  [format(new Date(), "yyyy-MM-dd")]: { marked: true, dotColor: "#f9a35e" },
                }}
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
                  arrowColor: "#f9a35e",
                }}
                style={{ borderRadius: 16, overflow: "hidden", marginBottom: 8 }}
              />

              {selectedDate && <TimePickerInline />}

              {selectedDate && (
                <View style={{ backgroundColor: "#f9a35e", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16, marginBottom: 16 }}>
                  <Text style={{ color: "#4e1709", fontSize: 13, fontWeight: "600" }}>
                    {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d")} at {formatTime12(selectedTime.hour, selectedTime.minute)}
                  </Text>
                </View>
              )}

              <SmoothButton
                onPress={handleRescheduleConfirm}
                disabled={!selectedDate || reschedule.isPending}
                style={{
                  backgroundColor: selectedDate ? "#f9a35e" : "#7e3f2d",
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {reschedule.isPending ? (
                  <ActivityIndicator color="#4e1709" size="small" />
                ) : (
                  <Text style={{ color: selectedDate ? "#4e1709" : "#7e3f2d", fontSize: 16, fontWeight: "700" }}>
                    Save Reminder
                  </Text>
                )}
              </SmoothButton>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
