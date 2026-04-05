import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

export default function Owl({ size = 120, style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View style={[{ transform: [{ translateY }] }, style]}>
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* Body */}
          <Ellipse cx="60" cy="70" rx="35" ry="40" fill="#7e3f2d" />

          {/* Head */}
          <Circle cx="60" cy="45" r="30" fill="#7e3f2d" />

          {/* Ear tufts */}
          <Path d="M 35 25 Q 32 15 38 20 Q 35 18 35 25" fill="#7e3f2d" />
          <Path d="M 85 25 Q 88 15 82 20 Q 85 18 85 25" fill="#7e3f2d" />

          {/* Left eye outer */}
          <Circle cx="48" cy="42" r="12" fill="#ffefdd" />

          {/* Right eye outer */}
          <Circle cx="72" cy="42" r="12" fill="#ffefdd" />

          {/* Left eye inner */}
          <Circle cx="48" cy="42" r="8" fill="#4e1709" />

          {/* Right eye inner */}
          <Circle cx="72" cy="42" r="8" fill="#4e1709" />

          {/* Left pupil highlight */}
          <Circle cx="50" cy="40" r="3" fill="#ffffff" />

          {/* Right pupil highlight */}
          <Circle cx="74" cy="40" r="3" fill="#ffffff" />

          {/* Beak */}
          <Path d="M 60 50 L 55 58 L 65 58 Z" fill="#f9a35e" />

          {/* Wings */}
          <Ellipse
            cx="35"
            cy="75"
            rx="8"
            ry="18"
            fill="#4e1709"
            opacity="0.6"
          />
          <Ellipse
            cx="85"
            cy="75"
            rx="8"
            ry="18"
            fill="#4e1709"
            opacity="0.6"
          />

          {/* Belly accent */}
          <Ellipse
            cx="60"
            cy="80"
            rx="18"
            ry="20"
            fill="#f9a35e"
            opacity="0.3"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}
