import React from "react";
import { View, TouchableOpacity, Text, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { WebView } from "react-native-webview";

const POLICY_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 16px; font-family: Arial, sans-serif; background: #fff; }
  [data-custom-class='body'], [data-custom-class='body'] * { background: transparent !important; }
  [data-custom-class='title'], [data-custom-class='title'] * { font-family: Arial !important; font-size: 26px !important; color: #000000 !important; }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * { font-family: Arial !important; color: #595959 !important; font-size: 14px !important; }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * { font-family: Arial !important; font-size: 19px !important; color: #000000 !important; }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * { font-family: Arial !important; font-size: 17px !important; color: #000000 !important; }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * { color: #595959 !important; font-size: 14px !important; font-family: Arial !important; }
  [data-custom-class='link'], [data-custom-class='link'] * { color: #3030F1 !important; font-size: 14px !important; font-family: Arial !important; word-break: break-word !important; }
</style>
</head>
<body>
<div data-custom-class="body">
<div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
<div><span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated April 08, 2026</span></span></strong></span></div>
<div><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text">This Privacy Notice for <strong>Drift Journal</strong> ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services").</span></div>
<div><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a>.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">1. WHAT INFORMATION DO WE COLLECT?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We collect personal information that you voluntarily provide when you register on the Services or contact us. This includes names, email addresses, usernames, passwords, and contact or authentication data.</span></div>
<div><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process categories of sensitive information including emotional and mental wellness data derived from journal entries.</span></div>
<div><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Application Data.</strong> We may collect the following if you grant permission: microphone access (for voice journaling) and push notification permissions (for reminders).</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. Specifically:</span></div>
<ul>
  <li data-custom-class="body_text">To facilitate account creation and authentication</li>
  <li data-custom-class="body_text">To deliver journaling services and personalize your experience</li>
  <li data-custom-class="body_text">To send push notifications at your scheduled times</li>
</ul>
<div><br></div>
<h2 data-custom-class="heading_1">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We do not sell your data. We share information only with our AI service provider (OpenAI) to generate session responses and summaries. Raw journal text is never stored on our servers — only short AI-generated summaries are retained.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">4. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Yes. Drift uses OpenAI's API to power its journaling prompts and generate session summaries. Your raw journal entries are processed by OpenAI to produce summaries, sentiment scores, and tags — after which the raw text is discarded. We do not use your data to train AI models.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We retain your account and session metadata for as long as your account is active. AI-generated session summaries are stored indefinitely in your history but are only referenced by the AI for the past 7 days. You may delete your data at any time through the app or by contacting us.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">All data is transmitted over encrypted connections (HTTPS). Your journal entries are stored in a secure database accessible only to you, enforced at the technical level. Notification reminders never contain your journal content.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">7. DO WE COLLECT INFORMATION FROM MINORS?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Drift is intended for users 18 and older. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a> and we will remove their data promptly.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">8. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You may view, update, or delete your personal information at any time. You can:</span></div>
<ul>
  <li data-custom-class="body_text">View your full journal history in the app</li>
  <li data-custom-class="body_text">Delete any individual entry</li>
  <li data-custom-class="body_text">Delete your account and all associated data permanently</li>
  <li data-custom-class="body_text">Opt out of pattern recognition and personalization</li>
  <li data-custom-class="body_text">Request that we stop processing your data</li>
</ul>
<div style="line-height: 1.5;"><span data-custom-class="body_text">To exercise these rights, contact us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a>.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">9. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Most web browsers and mobile operating systems include a Do-Not-Track feature. We do not currently respond to DNT browser signals as there is no uniform standard. You may opt out of personalization at any time through Settings → Personalization.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">10. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">Depending on your state of residence, you may have additional rights regarding your personal information. California residents may have rights under CCPA/CPRA. Virginia, Colorado, Connecticut, and other state residents may have rights under their respective state privacy laws. To exercise any of these rights, contact us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a>.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">11. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">We may update this Privacy Notice from time to time. If we make material changes, we will notify you in the app before those changes take effect. The updated version will be indicated by a revised date at the top of this notice.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">If you have questions or comments about this notice, email us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a> or through Settings → Help Center in the app.</span></div>
<div><br></div>
<h2 data-custom-class="heading_1">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
<div style="line-height: 1.5;"><span data-custom-class="body_text">You have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete it. To request to review, update, or delete your personal information, contact us at <a href="mailto:driftjournal8@gmail.com" data-custom-class="link">driftjournal8@gmail.com</a>.</span></div>
</div>
</body>
</html>`;

export default function FullPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ChevronLeft size={24} color="#ffefdd" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffefdd", flex: 1 }}>
          Full Privacy Policy
        </Text>
      </View>

      <WebView
        source={{ html: POLICY_HTML }}
        style={{ flex: 1, backgroundColor: "#fff" }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith("mailto:")) {
            Linking.openURL(req.url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}
