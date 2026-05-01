import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Mic, Infinity, Crown } from "lucide-react-native";
import Purchases from "react-native-purchases";
import { usePremium } from "@/hooks/usePremium";

export default function PremiumModal({ visible, onClose, onPurchaseSuccess }) {
  const [pkg, setPkg] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { refresh } = usePremium();

  useEffect(() => {
    if (!visible) return;
    Purchases.getOfferings().then((offerings) => {
      const available = offerings.current?.availablePackages ?? [];
      const match =
        available.find(
          (p) => p.product.identifier === "com.kendall.drift.premium.monthly"
        ) ?? available[0];
      setPkg(match ?? null);
    }).catch(() => setPkg(null));
  }, [visible]);

  const handlePurchase = async () => {
    if (!pkg) return;
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await refresh();
      if (customerInfo.entitlements.active["Drift Pro"]) {
        onPurchaseSuccess?.();
        onClose();
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Purchase failed", "Something went wrong. Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      await refresh();
      if (info.entitlements.active["Drift Pro"]) {
        onPurchaseSuccess?.();
        onClose();
      } else {
        Alert.alert("No subscription found", "We couldn't find an active subscription to restore.");
      }
    } catch {
      Alert.alert("Restore failed", "Something went wrong. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const SmoothButton = ({ onPress, children, style }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
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

  const Feature = ({ icon: Icon, title, description }) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 16 }}>
      <View style={{ backgroundColor: "#7e3f2d", padding: 12, borderRadius: 12 }}>
        <Icon size={24} color="#f9a35e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#ffefdd", fontSize: 16, fontWeight: "700", marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ color: "#7e3f2d", fontSize: 14 }}>{description}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose} animationDuration={800}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#4e1709", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "85%", paddingBottom: 40 }}>
          <View style={{ padding: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <SmoothButton onPress={onClose} style={{ padding: 8 }}>
                <X color="#7e3f2d" size={24} />
              </SmoothButton>
            </View>

            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <Crown color="#f9a35e" size={48} />
              <Text style={{ color: "#ffefdd", fontSize: 32, fontWeight: "800", marginTop: 12 }}>
                Drift Plus
              </Text>
              <Text style={{ color: "#7e3f2d", fontSize: 16, marginTop: 4 }}>
                The ultimate rest for your mind.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Feature
                icon={Mic}
                title="Voice Journaling"
                description="Speak your thoughts directly. Perfect for when you're too tired to type."
              />
              <Feature
                icon={Infinity}
                title="Unlimited Entries"
                description="Keep every memory and reflection forever."
              />
            </ScrollView>

            <SmoothButton
              onPress={handlePurchase}
              style={{
                backgroundColor: purchasing || !pkg ? "#7e3f2d" : "#f9a35e",
                paddingVertical: 18,
                borderRadius: 20,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              {purchasing ? (
                <ActivityIndicator color="#4e1709" />
              ) : (
                <>
                  <Text style={{ color: "#4e1709", fontSize: 18, fontWeight: "800" }}>
                    Start 3-Day Free Trial
                  </Text>
                  <Text style={{ color: "#4e1709", opacity: 0.8, fontSize: 12, marginTop: 2 }}>
                    Then $2.99 / month. Cancel anytime.
                  </Text>
                </>
              )}
            </SmoothButton>

            <TouchableOpacity onPress={handleRestore} disabled={restoring} style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ color: "#7e3f2d", fontSize: 13 }}>
                {restoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </TouchableOpacity>

            <Text style={{ textAlign: "center", color: "#7e3f2d", fontSize: 12, marginTop: 12 }}>
              Terms of Service • Privacy Policy
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
