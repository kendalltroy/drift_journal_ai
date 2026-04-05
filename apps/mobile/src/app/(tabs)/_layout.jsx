import { Tabs } from "expo-router";
import { Home, BookText, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarStyle: {
          backgroundColor: "#4e1709", // dark brown
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: "#f9a35e", // orange
        tabBarInactiveTintColor: "#7e3f2d", // medium brown
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <BookText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
