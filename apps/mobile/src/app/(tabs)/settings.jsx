import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Modal,
  Linking,
} from "react-native";
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
} from "lucide-react-native";
import PremiumModal from "@/components/PremiumModal";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPremium, setShowPremium] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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
          backgroundColor: "#7e3f2d",
          padding: 8,
          borderRadius: 8,
          marginRight: 16,
        }}
      >
        <Icon size={20} color="#f9a35e" />
      </View>
      <Text
        style={{ flex: 1, color: "#ffefdd", fontSize: 16, fontWeight: "500" }}
      >
        {label}
      </Text>
      {type === "link" && <ChevronRight size={20} color="#7e3f2d" />}
      {type === "toggle" && (
        <Switch value={value} trackColor={{ true: "#f9a35e" }} />
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
            value={true}
          />
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

        <SmoothButton style={{ alignItems: "center", padding: 16 }}>
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
